"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { customerApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"

interface Customer {
  id: number
  name: string
  type: string
  email: string | null
  phone: string | null
  address: string | null
}

export default function CustomerEdit({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const resolvedParams = use(params)
  const [form, setForm] = useState<{
    name: string;
    type: string;
    email: string;
    phone: string;
    address: string;
  }>({
    name: "",
    type: "",
    email: "",
    phone: "",
    address: ""
  })

  useEffect(() => {
    fetchCustomer()
  }, [resolvedParams.id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const response = await customerApi.getById(resolvedParams.id)
      if (response.success && response.data) {
        setCustomer(response.data as Customer)
        setForm({
          name: response.data?.name ?? "",
          type: response.data?.type ?? "",
          email: response.data?.email ?? "",
          phone: response.data?.phone ?? "",
          address: response.data?.address ?? ""
        })
      } else {
        toast.error("Failed to load customer")
      }
    } catch (error) {
      toast.error("An error occurred while loading the customer")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await customerApi.update(resolvedParams.id, form)
      if (response.success) {
        toast.success("Customer updated successfully")
        router.push(`/customers/${resolvedParams.id}`)
      } else {
        toast.error("Failed to update customer")
      }
    } catch (error) {
      toast.error("An error occurred while updating the customer")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Edit Customer" subtitle="Edit customer details" />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="flex justify-center items-center">
                <Spinner size={32} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Edit Customer" subtitle="Edit customer details" />
          <div className="flex-1 overflow-auto p-4">
            <Card className="p-6">
              <div className="text-center text-red-500">Customer not found</div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Edit Customer" subtitle="Edit customer details" />
        <div className="flex-1 overflow-auto p-4">
          <Card className="p-6 max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Input
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <Input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
