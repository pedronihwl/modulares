import { BadRequestException, CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { instanceToInstance, plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Observable, switchMap } from "rxjs";

/**
 * Interceptor que valida e transforma a resposta do controller antes de enviá-la ao cliente.
 *
 * @template T - Tipo genérico que DEVE ser um objeto (não pode ser string, number, etc)
 *               "T extends object" significa: "T pode ser qualquer tipo, desde que seja um objeto"
 *               Isso garante type-safety: só podemos usar DTOs que sejam classes/objetos
 */
export class RestResponseInterceptor<T extends object> implements NestInterceptor<any, T> {
    /**
     * @param dto - Recebe a CLASSE do DTO (não uma instância!)
     *              "new () => T" significa: "um construtor que quando chamado com 'new', retorna uma instância de T"
     *              Exemplo: se T é CreateVideoResponseDto, então dto é a própria classe CreateVideoResponseDto
     *              Guardamos a classe para poder criar instâncias dela depois com plainToInstance
     */
    constructor(private readonly dto: new () => T) {

    }

    /**
     * Método obrigatório de NestInterceptor que intercepta a execução do controller
     *
     * @param _ - ExecutionContext (contexto da requisição) - não usado aqui, por isso o underscore
     * @param next - CallHandler que permite continuar a execução e acessar a resposta do controller
     * @returns Observable<T> - Stream reativa que emitirá a resposta transformada e validada
     */
    intercept(_: ExecutionContext, next: CallHandler<any>): Observable<T> | Promise<Observable<T>> {
        /**
         * next.handle() - Executa o controller e retorna um Observable com a resposta
         *
         * .pipe() - Método do RxJS que permite encadear operadores para transformar o Observable
         *           Pense como um "pipeline" de transformações: o dado passa por cada operador em sequência
         *
         * switchMap() vs map():
         *
         * map() - Transforma valores SÍNCRONOS:
         *   Observable<A> -> map(a => b) -> Observable<B>
         *   Exemplo: Observable<number> -> map(x => x * 2) -> Observable<number>
         *
         * switchMap() - Transforma valores que retornam OBSERVABLES (ou Promises):
         *   Observable<A> -> switchMap(a => Observable<B>) -> Observable<B>
         *   "Achata" o Observable aninhado (Observable<Observable<B>> vira Observable<B>)
         *
         * O "switch" significa CANCELAMENTO:
         *   - Se um novo valor chegar ANTES do Observable anterior terminar, CANCELA o anterior
         *   - Sempre trabalha apenas com o Observable mais recente
         *   - Não é sobre "lock" (bloquear), é sobre DESCARTAR operações antigas
         *
         * Exemplo prático:
         *   - Você digita em um campo de busca: "cat"
         *   - Faz requisição para buscar "c"
         *   - Antes de "c" terminar, você digita "a"
         *   - switchMap CANCELA a busca de "c" e faz nova busca de "ca"
         *   - Isso evita que resultados antigos (de "c") apareçam depois dos novos (de "cat")
         *
         * Neste caso específico:
         *   - Usamos switchMap porque validate() retorna Promise (que é convertida em Observable)
         *   - O async/await dentro do switchMap retorna uma Promise
         *   - switchMap "achata": Observable<Promise<T>> -> Observable<T>
         */
        return next.handle().pipe(switchMap(async (data) => {
            const response = plainToInstance(this.dto, instanceToInstance(data), { excludeExtraneousValues: true })

            const errors = await validate(response)

            if (errors.length > 0) {
                throw new BadRequestException({ message: "Response validation failed", errors })
            }

            return response
        }))
    }
}