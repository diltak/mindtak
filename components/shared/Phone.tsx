'use client'

import 'react-phone-input-2/lib/style.css'
import PhoneInput from 'react-phone-input-2'
import { memo } from 'react'
interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
}

function Phone({ value, onChange }: PhoneInputProps) {
  return (
    <PhoneInput
      country="in"
      value={value}
      onChange={onChange}
      inputProps={{
        name: 'phone',
        required: true,
        autoFocus: true,
      }}
      containerStyle={{ width: '100%' }}
      inputStyle={{ width: '100%' }}
    />
  )
}

export default memo(Phone)