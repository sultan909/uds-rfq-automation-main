"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, FileText, Plus, Trash2, Upload } from "lucide-react"
import { SkuMappingDetector } from "@/components/sku-mapping-detector"
import { useCurrency } from "@/contexts/currency-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewRfq() {
  const { currency: globalCurrency } = useCurrency()
  const [selectedCurrency, setSelectedCurrency] = useState<"CAD" | "USD">(globalCurrency)
  const [rfqItems, setRfqItems] = useState([
    {
      id: 1,
      sku: "CF226X",
      description: "HP 26X High Yield Black Toner Cartridge",
      quantity: 5,
      price: null,
    },
    { id: 2, sku: "HP-55-X", description: "", quantity: 3, price: null },
    { id: 3, sku: "HP26X", description: "", quantity: 2, price: null },
  ])

  const [nonStandardSkus, setNonStandardSkus] = useState(["HP-55-X", "HP26X"])

  const [mappedItems, setMappedItems] = useState<{ original: string; mapped: string }[]>([])

  const handleMapSkus = (mappings: { original: string; mapped: string }[]) => {
    setMappedItems(mappings)

    // Update the RFQ items with the mapped SKUs
    if (mappings.length > 0) {
      const updatedItems = rfqItems.map((item) => {
        const mapping = mappings.find((m) => m.original === item.sku)
        if (mapping) {
          return {
            ...item,
            originalSku: item.sku,
            sku: mapping.mapped,
            description:
              mapping.mapped === "CF226X"
                ? "HP 26X High Yield Black Toner Cartridge"
                : mapping.mapped === "CE255X"
                  ? "HP 55X High Yield Black Toner Cartridge"
                  : item.description,
          }
        }
        return item
      })

      setRfqItems(updatedItems)
      setNonStandardSkus([])
    }
  }

  const addItem = () => {
    const newId = Math.max(...rfqItems.map((item) => item.id), 0) + 1
    setRfqItems([...rfqItems, { id: newId, sku: "", description: "", quantity: 1, price: null }])
  }

  const removeItem = (id: number) => {
    setRfqItems(rfqItems.filter((item) => item.id !== id))
  }

  const updateItem = (id: number, field: string, value: string | number | null) => {
    setRfqItems(rfqItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  // Function to update the selected currency
  const updateCurrency = (newCurrency: "CAD" | "USD") => {
    setSelectedCurrency(newCurrency)
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Create New RFQ" subtitle="Create a new request for quote" />
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-5xl mx-auto">
            {nonStandardSkus.length > 0 && <SkuMappingDetector skus={nonStandardSkus} onMapSkus={handleMapSkus} />}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>RFQ Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="customer">Customer</Label>
                    <Select>
                      <SelectTrigger id="customer" className="w-full">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech-solutions">Tech Solutions Inc</SelectItem>
                        <SelectItem value="abc-electronics">ABC Electronics</SelectItem>
                        <SelectItem value="global-systems">Global Systems</SelectItem>
                        <SelectItem value="midwest-distributors">Midwest Distributors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select>
                      <SelectTrigger id="source" className="w-full">
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="in-person">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mb-6">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Add any notes about this RFQ" className="min-h-[80px]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RFQ Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="manual">
                  <TabsList className="mb-4">
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="paste">Paste Text</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-4">
                    <div className="flex justify-end mb-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="default-currency" className="text-sm">
                          Currency:
                        </Label>
                        <Select
                          value={selectedCurrency}
                          onValueChange={(value: "CAD" | "USD") => updateCurrency(value)}
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-md border border-border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left font-medium text-foreground">SKU</th>
                            <th className="p-2 text-left font-medium text-foreground">Description</th>
                            <th className="p-2 text-left font-medium w-[100px] text-foreground">
                              Quantity <span className="text-xs text-muted-foreground">(Optional)</span>
                            </th>
                            <th className="p-2 text-left font-medium w-[120px] text-foreground">
                              Price <span className="text-xs text-muted-foreground">({selectedCurrency})</span>
                            </th>
                            <th className="p-2 text-left font-medium w-[80px] text-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rfqItems.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-2">
                                <div className="flex flex-col gap-1">
                                  <Input
                                    value={item.sku}
                                    onChange={(e) => updateItem(item.id, "sku", e.target.value)}
                                    placeholder="Enter SKU"
                                  />
                                  {item.originalSku && (
                                    <div className="text-xs text-muted-foreground">Original: {item.originalSku}</div>
                                  )}
                                </div>
                              </td>
                              <td className="p-2">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                  placeholder="Enter description"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "quantity",
                                      e.target.value ? Number.parseInt(e.target.value) : null,
                                    )
                                  }
                                  placeholder="Qty"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.price || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      item.id,
                                      "price",
                                      e.target.value ? Number.parseFloat(e.target.value) : null,
                                    )
                                  }
                                  placeholder="Price"
                                />
                              </td>
                              <td className="p-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                  disabled={rfqItems.length === 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button variant="outline" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <div className="space-y-2">
                        <div className="text-muted-foreground">Drag and drop your file here, or click to browse</div>
                        <Input type="file" className="hidden" id="file-upload" />
                        <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Browse Files
                        </Button>
                        <div className="text-xs text-muted-foreground">Supported formats: CSV, Excel (.xlsx, .xls)</div>
                      </div>
                    </div>

                    <div className="rounded-md border border-border p-4 bg-muted/20 dark:bg-muted/10">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          Download our{" "}
                          <a href="#" className="text-primary hover:underline">
                            template file
                          </a>{" "}
                          for easy uploading
                        </span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-4">
                    <div>
                      <Label htmlFor="paste-content">Paste RFQ Content</Label>
                      <Textarea
                        id="paste-content"
                        placeholder="Paste the content of the RFQ here (SKUs, quantities, etc.)"
                        className="min-h-[200px]"
                      />
                    </div>

                    <div className="rounded-md border border-border p-4 bg-muted/20 dark:bg-muted/10">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">Our system will attempt to extract SKUs and quantities from the pasted text</span>
                      </div>
                    </div>

                    <Button>Parse Content</Button>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex justify-end gap-2">
                  <Button>Create RFQ</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}





// "use client"

// import { useEffect, useState } from "react"
// import { Header } from "@/components/header"
// import { Sidebar } from "@/components/sidebar"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useCurrency } from "@/contexts/currency-context"
// import { rfqApi, customerApi } from "@/lib/api-client"
// import { toast } from "sonner"
// import { useRouter } from "next/navigation"

// interface RfqItem {
//   customerSku: string
//   description: string
//   quantity: number
//   unit: string
//   estimatedPrice: number
// }

// interface Customer {
//   id: number
//   name: string
//   email: string
//   type: string
// }

// export default function NewRfq() {
//   console.log("fffffffffffffff");
  
//   const router = useRouter()
//   const { currency, formatCurrency } = useCurrency()
//   const [loading, setLoading] = useState(false)
//   const [customers, setCustomers] = useState<Customer[]>([])
//   const [items, setItems] = useState<RfqItem[]>([{
//     customerSku: "",
//     description: "",
//     quantity: 1,
//     unit: "EA",
//     estimatedPrice: 0
//   }])

//   const [formData, setFormData] = useState({
//     customerId: "",
//     title: "",
//     description: "",
//     dueDate: "",
//     totalBudget: "",
//     source: "MANUAL",
//     notes: ""
//   })

//   useEffect(() => {
//     // Fetch customers for the dropdown
//     const fetchCustomers = async () => {
//       try {
//         const response = await customerApi.list()
//         if (response.success && response.data) {
//           // @ts-ignore
//           setCustomers(response.data )
//         } else {
//           toast.error("Failed to load customers")
//         }
//       } catch (error) {
//         toast.error("Failed to load customers")
//       }
//     }

//     fetchCustomers()
//   }, [])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }))
//   }

//   const handleItemChange = (index: number, field: keyof RfqItem, value: string | number) => {
//     const newItems = [...items]
//     newItems[index] = {
//       ...newItems[index],
//       [field]: value
//     }
//     setItems(newItems)
//   }

//   const addItem = () => {
//     setItems([...items, {
//       customerSku: "",
//       description: "",
//       quantity: 1,
//       unit: "EA",
//       estimatedPrice: 0
//     }])
//   }

//   const removeItem = (index: number) => {
//     if (items.length > 1) {
//       setItems(items.filter((_, i) => i !== index))
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)

//     try {
//       const response = await rfqApi.create({
//         ...formData,
//         items: items.map(item => ({
//           ...item,
//           estimatedPrice: parseFloat(item.estimatedPrice.toString())
//         }))
//       })

//       if (response.success) {
//         toast.success("RFQ created successfully")
//         router.push("/rfq-management")
//       } else {
//         toast.error("Failed to create RFQ")
//       }
//     } catch (error) {
//       toast.error("An error occurred while creating the RFQ")
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="flex h-screen">
//       <Sidebar />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header
//           title="Create New RFQ"
//           subtitle="Fill in the details to create a new request for quote"
//         />
//         <div className="flex-1 overflow-auto p-4">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>RFQ Information</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="customerId">Customer</Label>
//                     <Select
//                       value={formData.customerId}
//                       onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select a customer" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {customers.map((customer) => (
//                           <SelectItem key={customer.id} value={customer.id.toString()}>
//                             {customer.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="title">Title</Label>
//                     <Input
//                       id="title"
//                       name="title"
//                       value={formData.title}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="description">Description</Label>
//                   <Textarea
//                     id="description"
//                     name="description"
//                     value={formData.description}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="dueDate">Due Date</Label>
//                     <Input
//                       id="dueDate"
//                       name="dueDate"
//                       type="date"
//                       value={formData.dueDate}
//                       onChange={handleInputChange}
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="totalBudget">Total Budget</Label>
//                     <Input
//                       id="totalBudget"
//                       name="totalBudget"
//                       type="number"
//                       value={formData.totalBudget}
//                       onChange={handleInputChange}
//                       min="0"
//                       step="0.01"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="source">Source</Label>
//                     <Select
//                       value={formData.source}
//                       onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="MANUAL">Manual</SelectItem>
//                         <SelectItem value="EMAIL">Email</SelectItem>
//                         <SelectItem value="PORTAL">Portal</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>RFQ Items</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   {items.map((item, index) => (
//                     <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
//                       <div className="space-y-2">
//                         <Label>SKU</Label>
//                         <Input
//                           value={item.customerSku}
//                           onChange={(e) => handleItemChange(index, "customerSku", e.target.value)}
//                           placeholder="Customer SKU"
//                         />
//                       </div>
//                       <div className="space-y-2 md:col-span-2">
//                         <Label>Description</Label>
//                         <Input
//                           value={item.description}
//                           onChange={(e) => handleItemChange(index, "description", e.target.value)}
//                           placeholder="Item description"
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label>Quantity</Label>
//                         <Input
//                           type="number"
//                           value={item.quantity}
//                           onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
//                           min="1"
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label>Unit Price</Label>
//                         <Input
//                           type="number"
//                           value={item.estimatedPrice}
//                           onChange={(e) => handleItemChange(index, "estimatedPrice", parseFloat(e.target.value))}
//                           min="0"
//                           step="0.01"
//                         />
//                       </div>
//                       <div className="flex items-end">
//                         <Button
//                           type="button"
//                           variant="ghost"
//                           onClick={() => removeItem(index)}
//                           disabled={items.length === 1}
//                         >
//                           Remove
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                   <Button type="button" onClick={addItem} variant="outline">
//                     Add Item
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>

//             <div className="flex justify-end gap-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => router.push("/rfq-management")}
//               >
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={loading}>
//                 {loading ? "Creating..." : "Create RFQ"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }
