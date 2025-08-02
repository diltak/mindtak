import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Briefcase } from "lucide-react"

interface DepartmentDropdownProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

const departments = [
  "Engineering",
  "Marketing",
  "HR",
  "Design",
  "Sales",
  "Operations",
]

export function DepartmentDropdown({ value, onChange, required }: DepartmentDropdownProps) {
  return (
    <div className="w-full space-y-1">
      <Label className="flex items-center gap-1 text-sm font-medium">
        <Briefcase className="w-4 h-4" />
        Department {required && <span className="text-red-500">*</span>}
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full rounded-md border border-input px-3 py-2 text-sm">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept.toLowerCase()}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
