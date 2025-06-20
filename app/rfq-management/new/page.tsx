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
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

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
  unitPrice: number | null;
  currency: "CAD" | "USD";
  originalSku?: string;
  isProblematic?: boolean;
}

export default function NewRfqPage() {
  const { currency: globalCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState<"CAD" | "USD">(globalCurrency);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [textParsing, setTextParsing] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [rfqItems, setRfqItems] = useState<RfqItem[]>([
    {
      id: 1,
      sku: "",
      description: "",
      quantity: 1,
      unitPrice: null,
      currency: globalCurrency,
      isProblematic: false,
    },
  ]);

  const [nonStandardSkus, setNonStandardSkus] = useState<string[]>([]);
  const [mappedItems, setMappedItems] = useState<{ original: string; mapped: string }[]>([]);
  const [problematicSkus, setProblematicSkus] = useState<{sku: string; reason: string}[]>([]);

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

  // Check for problematic SKUs
  const checkProblematicSkus = async (skus: string[]) => {
    if (skus.length === 0) return;

    try {
      const response = await fetch('/api/sku-mapping/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus }),
      });

      const data = await response.json();
      
      if (data.success && data.data.problematicSkus) {
        setProblematicSkus(data.data.problematicSkus);
        
        // Update RFQ items to mark problematic ones
        setRfqItems(prevItems => 
          prevItems.map(item => ({
            ...item,
            isProblematic: data.data.problematicSkus.some((p: any) => p.sku === item.sku)
          }))
        );
      }
    } catch (error) {
      console.error('Error checking problematic SKUs:', error);
    }
  };

  // Auto-map SKUs and update database
  const autoMapSkus = async (mappings: { original: string; mapped: string }[]) => {
    if (mappings.length === 0) return;

    try {
      const response = await fetch('/api/sku-mapping/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mappings,
          customerId: selectedCustomer ? parseInt(selectedCustomer) : null
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully mapped ${mappings.length} SKUs to database`);
      }
    } catch (error) {
      console.error('Error auto-mapping SKUs:', error);
      toast.error('Failed to save SKU mappings to database');
    }
  };

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
            isProblematic: false,
          };
        }
        return item;
      });

      setRfqItems(updatedItems);
      setNonStandardSkus([]);
      setProblematicSkus([]);
      
      // Auto-save mappings to database
      autoMapSkus(mappings);
    }
  };

  const addItem = () => {
    const newId = Math.max(...rfqItems.map((item) => item.id), 0) + 1;
    setRfqItems([...rfqItems, { 
      id: newId, 
      sku: "", 
      description: "", 
      quantity: 1, 
      unitPrice: null,
      currency: selectedCurrency,
      originalSku: undefined,
      isProblematic: false,
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
            updatedItem.isProblematic = false;
          } else if (value.trim()) {
            setNonStandardSkus((prev) => [...new Set([...prev, value])]);
            // Check for problematic SKUs
            setTimeout(() => checkProblematicSkus([value]), 100);
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

  const updateAllItemsCurrency = (newCurrency: "CAD" | "USD") => {
    setRfqItems(rfqItems.map(item => ({
      ...item,
      currency: newCurrency
    })));
  };

  const updateItemCurrency = (id: number, newCurrency: "CAD" | "USD") => {
    setRfqItems(rfqItems.map(item => 
      item.id === id ? { ...item, currency: newCurrency } : item
    ));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
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
      setSubmitting(true);
      const response = await fetch('/api/rfq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(selectedCustomer),
          source: selectedSource,
          notes,
          items: rfqItems.map(item => ({
            sku: item.sku,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            currency: item.currency,
            unit: 'EA'
          })),
          currency: selectedCurrency,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to create RFQ`);
      }

      if (data.success) {
        toast.success(data.message || 'RFQ created successfully');
        // Redirect to the created RFQ detail page
        window.location.href = `/rfq-management/${data.data.id}`;
      } else {
        throw new Error(data.error || 'Failed to create RFQ');
      }
    } catch (error) {
      console.error('Error creating RFQ:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating RFQ';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input
    event.target.value = '';

    try {
      setFileUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/rfq/parse-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const newItems = data.data.items.map((item: any, index: number) => ({
          id: Math.max(...rfqItems.map((item) => item.id), 0) + index + 1,
          sku: item.sku,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price,
          currency: selectedCurrency,
          isProblematic: false,
        }));

        setRfqItems(newItems);
        
        // Check for non-standard SKUs
        const nonStandardSkus = newItems
          .filter((item: RfqItem) => !inventory.some((inv) => inv.sku === item.sku))
          .map((item: RfqItem) => item.sku);
        
        if (nonStandardSkus.length > 0) {
          setNonStandardSkus(nonStandardSkus);
          // Check for problematic SKUs
          checkProblematicSkus(nonStandardSkus);
        }

        let message = `Successfully imported ${data.data.totalItems} items`;
        if (data.data.errors && data.data.errors.length > 0) {
          message += ` with ${data.data.errors.length} warnings`;
        }
        toast.success(message);

        if (data.data.errors && data.data.errors.length > 0) {
          console.warn('Import warnings:', data.data.errors);
        }
      } else {
        toast.error(data.error || 'Failed to parse file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    } finally {
      setFileUploading(false);
    }
  };

  const handleParseText = async () => {
    if (!pasteContent.trim()) {
      toast.error('Please enter some text to parse');
      return;
    }

    try {
      setTextParsing(true);
      const response = await fetch('/api/rfq/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteContent }),
      });

      const data = await response.json();

      if (data.success) {
        const newItems = data.data.items.map((item: any, index: number) => ({
          id: Math.max(...rfqItems.map((item) => item.id), 0) + index + 1,
          sku: item.sku,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price,
          currency: selectedCurrency,
          isProblematic: false,
        }));

        setRfqItems(newItems);
        setPasteContent("");
        
        // Check for non-standard SKUs
        const nonStandardSkus = newItems
          .filter((item: RfqItem) => !inventory.some((inv) => inv.sku === item.sku))
          .map((item: RfqItem) => item.sku);
        
        if (nonStandardSkus.length > 0) {
          setNonStandardSkus(nonStandardSkus);
          // Check for problematic SKUs
          checkProblematicSkus(nonStandardSkus);
        }

        let message = `Successfully parsed ${data.data.totalItems} items`;
        if (data.data.duplicatesRemoved > 0) {
          message += ` (${data.data.duplicatesRemoved} duplicates removed)`;
        }
        toast.success(message);
      } else {
        toast.error(data.error || 'Failed to parse text');
      }
    } catch (error) {
      console.error('Error parsing text:', error);
      toast.error('Error parsing text');
    } finally {
      setTextParsing(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template
    const csvContent = "SKU,Description,Quantity,Price\nABC123,Sample Product 1,5,10.99\nXYZ789,Sample Product 2,2,25.50";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rfq-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Create New RFQ" subtitle="Create a new request for quote" />
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Create New RFQ" subtitle="Create a new request for quote" />
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-5xl mx-auto">
            {problematicSkus.length > 0 && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Problematic SKUs Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {problematicSkus.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-mono text-sm">{item.sku}</span>
                        <span className="text-sm text-orange-600">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-orange-700 mt-3">
                    These SKUs may need manual review or mapping before creating the RFQ.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {nonStandardSkus.length > 0 && (
              <SkuMappingDetector 
                skus={nonStandardSkus} 
                customerId={selectedCustomer ? parseInt(selectedCustomer) : undefined}
                onMapSkus={handleMapSkus} 
              />
            )}
            
            <div className="space-y-6">
              {/* RFQ Details Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    RFQ Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
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

                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Select value={selectedSource} onValueChange={setSelectedSource}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="PHONE">Phone</SelectItem>
                          <SelectItem value="WEBSITE">Website</SelectItem>
                          <SelectItem value="MANUAL">Manual Entry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter any additional notes or requirements"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Import Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Import Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="manual" className="w-full">
                    <TabsList>
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      <TabsTrigger value="file">File Upload</TabsTrigger>
                      <TabsTrigger value="paste">Paste Text</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual" className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Add items manually or use the other tabs to import from files or text.
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="file" className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500">Upload a file</span>
                            <span className="text-gray-600"> or drag and drop</span>
                          </Label>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.txt"
                            onChange={handleFileUpload}
                            disabled={fileUploading}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          CSV, Excel, or text files up to 10MB
                        </p>
                        {fileUploading && (
                          <div className="mt-4">
                            <div className="animate-pulse text-blue-600">Uploading and parsing file...</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-center">
                        <Button variant="outline" onClick={downloadTemplate}>
                          Download Template
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="paste" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="paste-content">Paste RFQ Items</Label>
                        <Textarea
                          id="paste-content"
                          placeholder="Paste your RFQ items here (SKU, description, quantity, price format)..."
                          value={pasteContent}
                          onChange={(e) => setPasteContent(e.target.value)}
                          rows={6}
                        />
                      </div>
                      <Button 
                        onClick={handleParseText}
                        disabled={!pasteContent.trim() || textParsing}
                      >
                        {textParsing ? "Parsing..." : "Parse Text"}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Items Section */}
              <Card>
                <CardHeader>
                  <CardTitle>RFQ Items</CardTitle>
                  
                  {/* Currency Control and Add Item Section */}
                  <div className="mt-4 p-4 bg-background border border-border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      {/* Left side - Currency Settings */}
                      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currency" className="text-sm font-medium">
                            Default Currency
                          </Label>
                          <Select value={selectedCurrency} onValueChange={updateCurrency}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CAD">CAD</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium sm:opacity-0">
                            Apply
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateAllItemsCurrency(selectedCurrency)}
                            className="w-full sm:w-auto"
                          >
                            Apply to All Items
                          </Button>
                        </div>
                      </div>

                      {/* Right side - Add Item Button */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium sm:opacity-0">
                          Actions
                        </Label>
                        <Button onClick={addItem} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {/* Information text */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Set the default currency for new items. Each item can have its own currency which you can override individually in the table below.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rfqItems.map((item, index) => (
                      <div key={item.id} className={`grid grid-cols-1 md:grid-cols-7 gap-4 items-end p-4 border rounded-lg ${item.isProblematic ? 'border-orange-300 bg-orange-50' : ''}`}>
                        <div className="space-y-2">
                          <Label>SKU</Label>
                          <Input
                            value={item.sku}
                            onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                            placeholder="Enter SKU"
                            list={`sku-suggestions-${item.id}`}
                          />
                          <datalist id={`sku-suggestions-${item.id}`}>
                            {inventory.map((invItem) => (
                              <option key={invItem.id} value={invItem.sku} />
                            ))}
                          </datalist>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Enter description"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select 
                            value={item.currency} 
                            onValueChange={(value: "CAD" | "USD") => updateItemCurrency(item.id, value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CAD">CAD</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Total</Label>
                          <div className="p-2 bg-muted rounded text-sm">
                            {item.unitPrice && item.quantity ? 
                              `${item.currency} ${(item.unitPrice * item.quantity).toFixed(2)}` : 
                              '-'
                            }
                          </div>
                        </div>

                        <div className="flex items-end">
                          {rfqItems.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {item.originalSku && (
                          <div className="md:col-span-7 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            Mapped from: {item.originalSku}
                          </div>
                        )}
                        
                        {item.isProblematic && (
                          <div className="md:col-span-7 text-sm text-orange-600 bg-orange-100 p-2 rounded">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            This SKU may require attention or mapping
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-between items-center pt-4 border-t">
                    <div className="text-lg font-semibold">
                      {(() => {
                        const cadTotal = rfqItems
                          .filter(item => item.currency === 'CAD')
                          .reduce((total, item) => 
                            total + (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0), 0
                          );
                        const usdTotal = rfqItems
                          .filter(item => item.currency === 'USD')
                          .reduce((total, item) => 
                            total + (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0), 0
                          );
                        
                        const parts = [];
                        if (cadTotal > 0) parts.push(`CAD ${cadTotal.toFixed(2)}`);
                        if (usdTotal > 0) parts.push(`USD ${usdTotal.toFixed(2)}`);
                        
                        return parts.length > 0 ? `Total: ${parts.join(' + ')}` : 'Total: $0.00';
                      })()}
                    </div>
                    
                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitting || !selectedCustomer || !selectedSource}
                      size="lg"
                    >
                      {submitting ? "Creating RFQ..." : "Create RFQ"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}