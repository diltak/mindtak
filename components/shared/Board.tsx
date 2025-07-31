/**
 * import table components from shadcn and some useful react functionality
 */
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Briefcase, Mail, PhoneCall, User, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@radix-ui/react-dialog";
import { DialogHeader } from "../ui/dialog";
import dynamic from "next/dynamic";
import { DepartmentDropdown } from "./DropDown";
import { Label } from "@radix-ui/react-label";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type EmployeeData = {
    id: string;
    name: string;
    mobile: string;
    email: string;
    phone : number,
    department: string,
    designation: string,
    employeeAddedAt: string;
};

export default function Board() {

    const [employee, setEmployee] = useState<EmployeeData[] | null>(null)
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        designation: ''
    })

    const Phone = useMemo(() => dynamic(() => import('./Phone'), { ssr: false }), [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const newEmployee = {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            department: data.department,
            designation: data.designation,
            employeeAdded: new Date()
        }

        try {
            await addDoc(collection(db, 'add-employee'), newEmployee)
            setOpen(false)
            setData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                department: '',
                designation: ''
            })
        } catch (error) {

        }
        finally {
            setLoading(false)
        }

    }

    async function fetchData() {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, "add-employee"));
            const data: EmployeeData[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...(doc.data() as Omit<EmployeeData, "id">) });
            });
            setEmployee(data);
        } catch (error) {
            setEmployee(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
fetchData()
    }, [])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        setData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handlePhoneChange = useCallback((value: string) => {
        setData((prev) => {
            if (prev.phone === value) return prev
            return { ...prev, phone: value }
        })
    }, [])

    const filteredData = (employee ?? []).filter((learner) =>
        learner.name.toLowerCase().includes(search.toLowerCase())
    );
    return (
        <>
            <div className="flex flex-row items-center justify-between mb-4">
                <Input
                    placeholder="Search..."
                    className="w-1/3"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="flex flex-row items-center justify-center gap-2">
                    <Users size={28} />
                    <Button
                        onClick={() => setOpen(true)}
                        variant='outline'>Add employee</Button>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogOverlay className="fixed inset-0 bg-black/50 z-40" />
                    <DialogContent className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        bg-white dark:bg-black rounded-lg shadow-lg w-full max-w-4xl p-8">

                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold mb-4">
                                Add Employee
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <Label htmlFor="firstName" className="flex items-center gap-1 text-sm font-medium">
                                    <User className="w-4 h-4" />
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={data.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="lastName" className="flex items-center gap-1 text-sm font-medium">
                                    <User className="w-4 h-4" />
                                    Last Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="lastName"
                                    placeholder="Last Name"
                                    name="lastName"
                                    value={data.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="email" className="flex items-center gap-1 text-sm font-medium">
                                    <Mail className='w-4 h-4' />Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    placeholder="Email"
                                    name="email"
                                    value={data.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="w-full space-y-1">

                                <Label className="flex items-center gap-1 text-sm font-medium">
                                    <PhoneCall className="w-4 h-4" />
                                    Phone No. <span className="text-red-500">*</span>
                                </Label>

                                <Phone
                                    value={data.phone}
                                    onChange={handlePhoneChange}
                                />
                            </div>

                            <DepartmentDropdown
                                value={data.department}
                                onChange={(value) => setData((prev) => ({ ...prev, department: value }))}
                                required
                            />
                            <div className="space-y-1">
                                <Label htmlFor="designation" className="flex items-center gap-1 text-sm font-medium">
                                    <Briefcase className='w-4 h-4' />Designation <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="designation"
                                    placeholder="Designation"
                                    name="designation"
                                    value={data.designation}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="flex gap-4 col-span-2 justify-end pt-4">
                                <Button variant="destructive" type="button" onClick={() => setOpen(false)}>
                                    Close
                                </Button>
                                <Button type="submit" variant="default">
                                    Add Employee
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>


                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">Show Entries</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>10</DropdownMenuItem>
                        <DropdownMenuItem>25</DropdownMenuItem>
                        <DropdownMenuItem>50</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {loading ? (
                <div className="text-center py-6 text-muted-foreground">Loading employees...</div>
            ) : error ? (
                <div className="text-center py-6 text-red-500">{error}</div>
            ) : filteredData.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No employees found.</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>S.No.</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Employee Added At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((learner, index) => (
                            <TableRow key={learner.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{learner.name}</TableCell>
                                <TableCell>{learner.email}</TableCell>
                                <TableCell>{learner.phone}</TableCell>
                                <TableCell>{learner.department}</TableCell>
                                <TableCell>{learner.designation}</TableCell>
                                <TableCell>{learner.employeeAddedAt}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </>
    )
}
