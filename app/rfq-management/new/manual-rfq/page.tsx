"use client";

// Using the manual RFQ form code you provided
import { useState } from "react";
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

export default function ManualRfqPage() {
  const { currency: globalCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState<"CAD" | "USD">(globalCurrency);
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
  ]);

  const [nonStandardSkus, setNonStandardSkus] = useState(["HP-55-X", "HP26X"]);
  const [mappedItems, setMappedItems] = useState<{ original: string; mapped: string }[]>([]);

  const handleMapSkus = (mappings: { original: string; mapped: string }[]) => {
    setMappedItems(mappings);

    // Update the RFQ items with the mapped SKUs
    if (mappings.length > 0) {
      const updatedItems = rfqItems.map((item) => {
        const mapping = mappings.find((m) => m.original === item.sku);
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
    setRfqItems([...rfqItems, { id: newId, sku: "", description: "", quantity: 1, price: null }]);
  };

  const removeItem = (id: number) => {
    setRfqItems(rfqItems.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: string | number | null) => {
    setRfqItems(rfqItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // Function to update the selected currency
  const updateCurrency = (newCurrency: "CAD" | "USD") => {
    setSelectedCurrency(newCurrency);
  };

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
  );
}