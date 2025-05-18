"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Upload, AlertCircle } from "lucide-react"

// Mock data - replace with actual API calls in your implementation
const MOCK_CUSTOMERS = [
  { id: "1", name: "ABC Electronics" },
  { id: "2", name: "Tech Solutions Inc" },
  { id: "3", name: "Global Systems" },
  { id: "4", name: "Midwest Distributors" },
]

// Mock product database for SKU matching
const PRODUCT_DATABASE = [
  { id: 1, sku: "CF226X", description: "HP 26X High Yield Black Toner Cartridge", price: 149.99 },
  { id: 2, sku: "CE255X", description: "HP 55X High Yield Black Toner Cartridge", price: 129.99 },
  { id: 3, sku: "CF287X", description: "HP 87X High Yield Black Toner Cartridge", price: 159.99 },
  { id: 4, sku: "CC364X", description: "HP 64X High Yield Black Toner Cartridge", price: 139.99 },
]

// Type for parsed items
type ParsedItem = {
  customerSku: string;
  description?: string;
  quantity: number;
  internalProductId: number | null;
  matchedProduct: typeof PRODUCT_DATABASE[0] | null;
  status: "matched" | "no-match" | "pending";
};

export default function EmailParser() {
  const [activeTab, setActiveTab] = useState("email")
  const [emailContent, setEmailContent] = useState("")
  const [customer, setCustomer] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [isParsingText, setIsParsingText] = useState(false)
  const [isCreatingRfq, setIsCreatingRfq] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  
  // Mock function to simulate finding SKU matches
  const findSkuMatch = (customerSku: string) => {
    // Simplified mock matching logic
    // Strip any non-alphanumeric characters for more flexible matching
    const normalizedCustomerSku = customerSku.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    
    const product = PRODUCT_DATABASE.find(product => {
      const normalizedProductSku = product.sku.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
      return normalizedProductSku === normalizedCustomerSku
    })
    
    return product || null
  }

  // Parse the email text to extract SKUs and quantities
  const parseEmailText = () => {
    if (!emailContent) return
    
    setIsParsingText(true)
    
    // Simulate network delay
    setTimeout(() => {
      try {
        const lines = emailContent.trim().split('\n')
        const items: ParsedItem[] = []
        
        for (const line of lines) {
          if (!line.trim()) continue
          
          // Extract SKU (simple regex for demo)
          const skuMatch = line.match(/([A-Z0-9]+-?[A-Z0-9]+)/i)
          
          if (skuMatch) {
            const customerSku = skuMatch[1]
            
            // Extract quantity (simple regex for demo)
            const qtyMatch = line.match(/qty:?\s*(\d+)|(\d+)\s*units?|quantity:?\s*(\d+)/i)
            const quantity = qtyMatch ? parseInt(qtyMatch[1] || qtyMatch[2] || qtyMatch[3]) : 1
            
            // Find matching product
            const matchedProduct = findSkuMatch(customerSku)
            
            items.push({
              customerSku,
              description: line,
              quantity,
              internalProductId: matchedProduct?.id || null,
              matchedProduct,
              status: matchedProduct ? "matched" : "no-match"
            })
          }
        }
        
        setParsedItems(items)
      } catch (error) {
        console.error("Error parsing email:", error)
        // In a real app, you'd show a toast or other error notification
      } finally {
        setIsParsingText(false)
      }
    }, 800) // Simulate parsing delay
  }
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Handle file upload logic here - for demo, we'll just read the file as text
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const content = event.target?.result as string
      setEmailContent(content)
      setActiveTab("email") // Switch to email tab to show the content
    }
    
    reader.readAsText(file)
  }
  
  // Create RFQ function
  const createRfq = () => {
    if (!customer) {
      // In a real app, show a toast or notification
      alert("Please select a customer")
      return
    }
    
    if (parsedItems.length === 0) {
      // In a real app, show a toast or notification
      alert("No items found to create RFQ")
      return
    }
    
    setIsCreatingRfq(true)
    
    // Mock API call - in a real app, this would be an actual API request
    setTimeout(() => {
      console.log("Creating RFQ:", {
        customer,
        notes,
        items: parsedItems
      })
      
      // Reset form after "successful" creation
      setCustomer("")
      setNotes("")
      setEmailContent("")
      setParsedItems([])
      setIsCreatingRfq(false)
      
      // In a real app, show a success toast and navigate to the created RFQ
      alert("RFQ created successfully!")
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RFQ Email Parser</h1>
        <p className="text-muted-foreground">Create new RFQs from email text or uploaded files</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create RFQ from Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CUSTOMERS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Select the customer who sent this RFQ</p>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any notes about this RFQ" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            {/* Email/File Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email Text</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              
              {/* Email Text Tab */}
              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea 
                    id="email-content" 
                    placeholder="Paste the content of the email here" 
                    className="min-h-[200px]"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Paste the text from the customer's email to extract SKUs and quantities
                  </p>
                </div>
                
                <Button 
                  onClick={parseEmailText} 
                  disabled={isParsingText || !emailContent}
                >
                  {isParsingText && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isParsingText ? "Parsing..." : "Parse Email Text"}
                </Button>
              </TabsContent>
              
              {/* File Upload Tab */}
              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Input 
                    type="file" 
                    accept=".csv,.txt,.xlsx,.xls" 
                    className="hidden" 
                    id="file-upload"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <span className="mt-2 text-sm font-medium">Upload CSV or Text File</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Drag and drop your file here, or click to browse
                    </span>
                  </label>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Parsed Items Section */}
            {parsedItems.length > 0 && (
              <div className="space-y-4 mt-6 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Parsed Items</h3>
                  <div className="text-sm text-muted-foreground">
                    {parsedItems.filter(item => item.status === "matched").length} of {parsedItems.length} items matched
                  </div>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Matched Product</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.customerSku}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {item.status === "matched" ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                No Match
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.matchedProduct ? (
                              <span>
                                {item.matchedProduct.sku} - {item.matchedProduct.description}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not matched</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {parsedItems.some(item => item.status === "no-match") && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-4 py-3 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Some items could not be matched</p>
                      <p className="text-sm mt-1">
                        Unmatched items will be added to the RFQ without an internal product reference. You can manually map these SKUs later.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setParsedItems([])}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createRfq}
                    disabled={isCreatingRfq || parsedItems.length === 0 || !customer}
                  >
                    {isCreatingRfq && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCreatingRfq ? "Creating..." : "Create RFQ"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}