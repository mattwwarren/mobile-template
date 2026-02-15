import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form'
import type { TextInputProps } from 'react-native'

import { Input } from '@/components/ui/Input'

interface FormFieldProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>
  name: Path<T>
  label?: string | undefined
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  ...rest
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          label={label}
          error={error?.message}
          value={value as string}
          onChangeText={onChange}
          onBlur={onBlur}
          {...rest}
        />
      )}
    />
  )
}
