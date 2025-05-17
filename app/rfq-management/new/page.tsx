"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrency } from "@/contexts/currency-context"
import { rfqApi, customerApi } from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RfqItem {
  customerSku: string
  description: string
  quantity: number
  unit: string
  estimatedPrice: number
}

interface Customer {
  id: number
  name: string
  email: string
  type: string
}

export default function NewRfq() {
  console.log("fffffffffffffff");
  
  const router = useRouter()
  const { currency, formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<RfqItem[]>([{
    customerSku: "",
    description: "",
    quantity: 1,
    unit: "EA",
    estimatedPrice: 0
  }])

  const [formData, setFormData] = useState({
    customerId: "",
    title: "",
    description: "",
    dueDate: "",
    totalBudget: "",
    source: "MANUAL",
    notes: ""
  })

  useEffect(() => {
    // Fetch customers for the dropdown
    const fetchCustomers = async () => {
      try {
        const response = await customerApi.list()
        if (response.success && response.data) {
          // @ts-ignore
          setCustomers(response.data )
        } else {
          toast.error("Failed to load customers")
        }
      } catch (error) {
        toast.error("Failed to load customers")
      }
    }

    fetchCustomers()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index: number, field: keyof RfqItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, {
      customerSku: "",
      description: "",
      quantity: 1,
      unit: "EA",
      estimatedPrice: 0
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await rfqApi.create({
        ...formData,
        items: items.map(item => ({
          ...item,
          estimatedPrice: parseFloat(item.estimatedPrice.toString())
        }))
      })

      if (response.success) {
        toast.success("RFQ created successfully")
        router.push("/rfq-management")
      } else {
        toast.error("Failed to create RFQ")
      }
    } catch (error) {
      toast.error("An error occurred while creating the RFQ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Create New RFQ"
          subtitle="Fill in the details to create a new request for quote"
        />
        <div className="flex-1 overflow-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>RFQ Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalBudget">Total Budget</Label>
                    <Input
                      id="totalBudget"
                      name="totalBudget"
                      type="number"
                      value={formData.totalBudget}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PORTAL">Portal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RFQ Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input
                          value={item.customerSku}
                          onChange={(e) => handleItemChange(index, "customerSku", e.target.value)}
                          placeholder="Customer SKU"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          value={item.estimatedPrice}
                          onChange={(e) => handleItemChange(index, "estimatedPrice", parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" onClick={addItem} variant="outline">
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/rfq-management")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create RFQ"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
