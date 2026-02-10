import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios"
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from 'axios';
import { HttpClientException } from '@sharedModule/http-client/exception/http-client.exception';

@Injectable()
export class HttpClient {

    constructor(private readonly httpService: HttpService){

    }

    async get<T extends Record<string, any>>(url: string, options: Record<string, any>){
        const { data } = await firstValueFrom(
            this.httpService.get<T>(url, options).pipe(
                catchError((error: AxiosError) => {
                    throw new HttpClientException(
                        `Error fetching data from ${url}: ${error}`
                    )
                })
            )
        )

        return data
    }
}