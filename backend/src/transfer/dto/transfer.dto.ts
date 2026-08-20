import { IsString, Matches, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Le numéro du destinataire doit être au format E.164 (ex: +2250701020304)',
  })
  recipientPhone: string;

  @IsNumber()
  @Min(1, { message: 'Le montant doit être supérieur à 0' })
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
