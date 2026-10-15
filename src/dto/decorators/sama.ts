import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

// Validasi antar-field. Dipakai: @Sama("password") pada konfirmasiPassword.
// Nilai kedua field dibandingkan dengan ===, jadi tipe dan isinya harus persis sama.
export function Sama(propertiLain: string, options?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: "sama",
      target: object.constructor,
      propertyName,
      constraints: [propertiLain],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [namaLain] = args.constraints as [string];
          return value === (args.object as Record<string, unknown>)[namaLain];
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} harus sama dengan ${args.constraints[0]}`;
        },
      },
    });
  };
}