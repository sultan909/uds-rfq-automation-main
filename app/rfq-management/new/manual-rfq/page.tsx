"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, FileText, Plus, Trash2, Upload } from "lucide-react";
import { SkuMappingDetector } from "@/components/sku-mapping-detector";
import { useCurrency } from "@/contexts/currency-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Customer {
  id: number;
  name: string;
  type: string;
}

interface InventoryItem {
  id: number;
  sku: string;
  description: string;
  brand: string;
  mpn: string;
}

interface RfqItem {
  id: number;
  sku: string;
  description: string;
  quantity: number;
  price: number | null;
  originalSku?: string;
}

export default function ManualRfqPage() {
  const { currency: globalCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState<"CAD" | "USD">(globalCurrency);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rfqItems, setRfqItems] = useState<RfqItem[]>([
    {
      id: 1,
      sku: "",
      description: "",
      quantity: 1,
      price: null,
    },
  ]);

  const [nonStandardSkus, setNonStandardSkus] = useState<string[]>([]);
  const [mappedItems, setMappedItems] = useState<{ original: string; mapped: string }[]>([]);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await fetch('/api/rfq/new');
        const data = await response.json();
        
        if (data.success) {
          setCustomers(data.data.customers);
          setInventory(data.data.inventory);
        } else {
          toast.error('Failed to load form data');
        }
      } catch (error) {
        toast.error('Error loading form data');
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, []);

  const handleMapSkus = (mappings: { original: string; mapped: string }[]) => {
    setMappedItems(mappings);

    if (mappings.length > 0) {
      const updatedItems = rfqItems.map((item) => {
        const mapping = mappings.find((m) => m.original === item.sku);
        if (mapping) {
          const inventoryItem = inventory.find((inv) => inv.sku === mapping.mapped);
          return {
            ...item,
            originalSku: item.sku,
            sku: mapping.mapped,
            description: inventoryItem?.description || item.description,
          };
        }
        return item;
      });

      setRfqItems(updatedItems);
      setNonStandardSkus([]);
    }
  };

  const addItem = () => {
    const newId = Math.max(...rfqItems.map((item) => item.id), 0) + 1;
    setRfqItems([...rfqItems, { 
      id: newId, 
      sku: "", 
      description: "", 
      quantity: 1, 
      price: null,
      originalSku: undefined 
    }]);
  };

  const removeItem = (id: number) => {
    setRfqItems(rfqItems.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: string | number | null) => {
    setRfqItems(rfqItems.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If SKU is updated, check if it exists in inventory
        if (field === 'sku' && typeof value === 'string') {
          const inventoryItem = inventory.find((inv) => inv.sku === value);
          if (inventoryItem) {
            updatedItem.description = inventoryItem.description;
          } else {
            setNonStandardSkus((prev) => [...new Set([...prev, value])]);
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const updateCurrency = (newCurrency: "CAD" | "USD") => {
    setSelectedCurrency(newCurrency);
  };

  const handleSubmit = async () => {
    console.log("IN MMMMMMMMMMM");
    
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (!selectedSource) {
      toast.error('Please select a source');
      return;
    }

    if (rfqItems.some(item => !item.sku)) {
      toast.error('Please fill in all SKUs');
      return;
    }

    try {
      const response = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(selectedCustomer),
          source: selectedSource,
          notes,
          items: rfqItems.map(item => ({
            sku: item.sku,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
          currency: selectedCurrency,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('RFQ created successfully');
        // Redirect to RFQ list or detail page
        window.location.href = '/rfq-management';
      } else {
        toast.error(data.error || 'Failed to create RFQ');
      }
    } catch (error) {
      console.error('Error creating RFQ:', error);
      toast.error('Error creating RFQ');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {nonStandardSkus.length > 0 && <SkuMappingDetector skus={nonStandardSkus} onMapSkus={handleMapSkus} />}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>RFQ Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger id="customer" className="w-full">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} ({customer.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
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
            <Textarea 
              id="notes" 
              placeholder="Add any notes about this RFQ" 
              className="min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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

              <div className="flex justify-between">
                <Button variant="outline" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
                <Button onClick={handleSubmit}>Create RFQ</Button>
              </div>
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
        </CardContent>
      </Card>
    </div>
  );
}