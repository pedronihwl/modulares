# Aprendizado - 17/01/2026

## Arquitetura e Design Patterns

### Use Cases vs Services
- **Use Cases**: Classes para apps com regras de negócio mais complexas para não congestionar o service
- **Services**: Conjuntos de use cases

### Validação
É importante além de validar a entrada de um HTTP Request, validar a resposta também

### Interceptors vs Middlewares
Interceptors são melhores que middlewares embora desempenham o mesmo papel

> **Revisar**: Interceptors equivalem aos filters do Chain do C#?

---

## Camada de Persistência

### DAO (Data Access Object)
- É o objeto passado para a camada de persistência
- **NÃO É UM REPOSITORY**
- É o objeto que você mapeia para o banco
- Hoje em dia está obsoleto

### Repository
É a classe que realiza o mapeamento em si

---

## Princípios de Design

### Abstrações (Interfaces)
Abstrações (interfaces) podem adicionar complexidade desnecessária. Antigamente devido a necessidade era importante ter esse nível de desacoplamento, porém com a evolução das ORMs isso hoje em dia não é tão necessário

### Inversão de Dependência
Inversão de dependência é apenas para **ISOLAR dependências de camadas externas**

---

## Domain-Driven Design (DDD)

De acordo com o DDD, o domínio não deve ser dependente do banco de dados. O banco de dados que deve se adequar ao que está escrito em código.

### Dica
Crie tudo da entidade de domínio no código e faça funcionar, após isso vincule a persistência

---

## Dúvidas

### Injeção de Symbols no NestJS

**Pergunta**: Como faço para injetar Symbols no NestJS, me fala para que serve e me dê um exemplo visual

**Resposta**:

Symbols no NestJS são usados como tokens de injeção únicos para evitar conflitos de nomes, especialmente úteis quando você tem múltiplas implementações da mesma interface.

#### Para que serve:
- Criar tokens de injeção únicos e imutáveis
- Evitar colisões de nomes entre providers
- Facilitar a injeção de dependências com interfaces

#### Exemplo visual:

**1. Criar o Symbol:**
```typescript
// constants/injection-tokens.ts
export const VIDEO_REPOSITORY = Symbol('VIDEO_REPOSITORY');
```

**2. Registrar no módulo:**
```typescript
// video.module.ts
@Module({
  providers: [
    {
      provide: VIDEO_REPOSITORY,
      useClass: PrismaVideoRepository,
    },
  ],
})
export class VideoModule {}
```

**3. Injetar no construtor:**
```typescript
// video.service.ts
@Injectable()
export class VideoService {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {}
}
```

#### Por que usar Symbol ao invés de string?
- **Symbols são únicos**: Dois Symbols nunca serão iguais, mesmo com a mesma descrição
- **Type-safe**: Evita erros de digitação
- **Melhor refatoração**: IDEs conseguem rastrear o uso do Symbol
