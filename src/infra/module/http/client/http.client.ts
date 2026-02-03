import { Injectable } from "@nestjs/common";


/**
 * Justificativa:
 * Pura infraestrutura que lida com HTTP
 * Centraliza as chamadas em um método de infraestrutura que todo mundo usa
 */
@Injectable()
export class HttpClient {
    async get<T>(url: string, options: Record<string,any>): Promise<T> {
        const res = await fetch(url, options)

        if(!res.ok){
            console.warn(url)
            const errorMessage = await res.text()
            throw new Error(`Failed to fetch ${errorMessage}`)
        }

        return (await res.json()) as T
    }
}