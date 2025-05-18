"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowUpDown, Check, ChevronDown, Edit, Plus, Search, Trash2, Upload } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { customerApi } from "@/lib/api-client"
import AllMappingsTab from "./AllMappingsTab"
import RecentlyAddedTab from "./RecentlyAddedTab"
import ProblematicSkusTab from "./ProblematicSkusTab"

export default function SkuMapping() {
  const [mappings, setMappings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newMapping, setNewMapping] = useState({
    standardSku: "",
    standardDescription: "",
    variations: [{ sku: "", source: "", customerId: undefined }],
  })
  const [editMapping, setEditMapping] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [mappingToDelete, setMappingToDelete] = useState<number | null>(null)
  const [inventorySkus, setInventorySkus] = useState<any[]>([])
  const [skuOptions, setSkuOptions] = useState<any[]>([])
  const [skuDropdownOpen, setSkuDropdownOpen] = useState(false)
  const skuInputRef = useRef<HTMLInputElement>(null)
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerOptions, setCustomerOptions] = useState<any[][]>([]); // Array of options per variation
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState<number | null>(null);

  // Fetch mappings from backend on mount
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const res = await fetch("/api/sku-mapping");
        const data = await res.json();
        setMappings(data.data || []);
      } catch (err) {
        // Optionally show error toast
        setMappings([]);
      }
    };
    fetchMappings();
  }, []);

  // Fetch inventory SKUs and filter out mapped SKUs when modal opens
  useEffect(() => {
    if (isAddDialogOpen || isEditDialogOpen) {
      const fetchData = async () => {
        const invRes = await fetch("/api/inventory/list?page=1&pageSize=1000")
        const invData = await invRes.json()
        console.log("Full inventory API response:", invData)
        // Try to resolve the items array from possible response shapes
        const items = Array.isArray(invData.data) ? invData.data
                    : Array.isArray(invData.data.items) ? invData.data.items
                    : Array.isArray(invData) ? invData
                    : [];
        console.log("Resolved inventory items array:", items)
        const mapRes = await fetch("/api/sku-mapping?page=1&pageSize=1000")
        const mapData = await mapRes.json()
        console.log("Full SKU mapping API response:", mapData)
        const mappedSkus = new Set((mapData.data || []).map((m: any) => m.standardSku))
        console.log("Mapped SKUs:", mappedSkus)
        const available = items.filter((item: any) => item.sku && !mappedSkus.has(item.sku))
        console.log("Available inventory SKUs:", available)
        setInventorySkus(available)
        setSkuOptions(available)
        // Fetch all customers using customerApi
        try {
          const custData = await customerApi.list({ page: String(1), pageSize: String(1000) });
          let custItems: any[] = [];
          if (custData && Array.isArray(custData.data)) {
            custItems = custData.data;
          } else if (custData && custData.data && Array.isArray((custData.data as any).items)) {
            custItems = (custData.data as any).items;
          }
          setCustomers(custItems);
          setCustomerOptions([[]]);
        } catch (err) {
          setCustomers([]);
          setCustomerOptions([[]]);
        }
      }
      fetchData()
    }
  }, [isAddDialogOpen, isEditDialogOpen])

  // Filter mappings based on search term
  const filteredMappings = mappings.filter(
    (mapping: any) =>
      mapping.standardSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.standardDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.variations.some(
        (v: any) =>
          v.variationSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.source.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )

  // Add a new mapping (integrated with backend, supports batch)
  const handleAddMapping = async () => {
    // Support for future batch: if newMapping is an array, send all
    const mappingsToAdd = Array.isArray(newMapping) ? newMapping : [newMapping];
    try {
      // POST each mapping (or batch if backend supports it)
      const responses = await Promise.all(
        mappingsToAdd.map(async (mapping) => {
          const res = await fetch("/api/sku-mapping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              standardSku: mapping.standardSku,
              standardDescription: mapping.standardDescription,
              variations: mapping.variations.map((v: any) => ({
                sku: v.sku,
                source: v.source,
                customerId: v.customerId || 1 // fallback if not selected
              })),
            }),
          });
          if (!res.ok) throw new Error("Failed to add mapping");
          return res.json();
        })
      );
      // After adding, fetch updated mappings from backend
      const fetchRes = await fetch("/api/sku-mapping");
      const data = await fetchRes.json();
      setMappings(data.data || []);
      setNewMapping({
        standardSku: "",
        standardDescription: "",
        variations: [{ sku: "", source: "", customerId: undefined }],
      });
      setIsAddDialogOpen(false);
    } catch (err) {
      // Optionally show error toast
      alert("Failed to add SKU mapping(s)");
    }
  };

  // Update an existing mapping
  const handleUpdateMapping = () => {
    if (!editMapping) return

    setMappings(mappings.map((mapping) => (mapping.id === editMapping.id ? editMapping : mapping)))

    setIsEditDialogOpen(false)
    setEditMapping(null)
  }

  // Delete a mapping
  const handleDeleteMapping = () => {
    if (mappingToDelete === null) return

    setMappings(mappings.filter((mapping) => mapping.id !== mappingToDelete))
    setIsDeleteDialogOpen(false)
    setMappingToDelete(null)
  }

  // Add a variation to a new mapping
  const addVariationToNew = () => {
    setNewMapping({
      ...newMapping,
      variations: [...newMapping.variations, { sku: "", source: "", customerId: undefined }],
    })
  }

  // Remove a variation from a new mapping
  const removeVariationFromNew = (index: number) => {
    setNewMapping({
      ...newMapping,
      variations: newMapping.variations.filter((_, i) => i !== index),
    })
  }

  // Add a variation to an existing mapping
  const addVariationToEdit = () => {
    if (!editMapping) return

    const newId = Math.max(...mappings.flatMap((m: any) => m.variations.map((v: any) => v.id)), 0) + 1

    setEditMapping({
      ...editMapping,
      variations: [...editMapping.variations, { id: newId, sku: "", source: "", customerId: undefined }],
    })
  }

  // Remove a variation from an existing mapping
  const removeVariationFromEdit = (id: number) => {
    if (!editMapping) return

    setEditMapping({
      ...editMapping,
      variations: editMapping.variations.filter((v: any) => v.id !== id),
    })
  }

  // Handle Standard SKU input change (typeahead logic)
  const handleStandardSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMapping({ ...newMapping, standardSku: value });
    if (!value) {
      setSkuOptions(inventorySkus);
      setSkuDropdownOpen(false);
      setNewMapping((prev) => ({ ...prev, standardDescription: "" }));
      return;
    }
    // Filter options (case-insensitive, partial match)
    const filtered = inventorySkus.filter((item: any) =>
      item.sku && item.sku.toLowerCase().includes(value.toLowerCase())
    );
    console.log("Filtered options:", filtered, "Input value:", value);
    setSkuOptions(filtered);
    setSkuDropdownOpen(filtered.length > 0 || value.length > 0);
    const match = inventorySkus.find((item: any) => item.sku && item.sku.toLowerCase() === value.toLowerCase());
    if (match) {
      setNewMapping((prev) => ({ ...prev, standardDescription: match.description }));
    } else {
      setNewMapping((prev) => ({ ...prev, standardDescription: "" }));
    }
  };

  // Handle SKU option select
  const handleSkuOptionSelect = (sku: string, description: string) => {
    setNewMapping((prev) => ({ ...prev, standardSku: sku, standardDescription: description }))
    setSkuDropdownOpen(false)
    // Focus out of input
    skuInputRef.current?.blur()
  }

  // Handle customer source input change for a variation
  const handleCustomerSourceChange = (index: number, value: string) => {
    const updatedVariations = [...newMapping.variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      source: value,
      customerId: undefined // Reset customerId if typing
    };
    setNewMapping({ ...newMapping, variations: updatedVariations });
    // Filter customer options
    const filtered = customers.filter((c: any) =>
      c.name && c.name.toLowerCase().includes(value.toLowerCase())
    );
    const newOptions = [...customerOptions];
    newOptions[index] = filtered;
    setCustomerOptions(newOptions);
    setCustomerDropdownOpen(filtered.length > 0 ? index : null);
  };

  // Handle customer option select
  const handleCustomerOptionSelect = (index: number, customer: any) => {
    const updatedVariations = [...newMapping.variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      source: customer.name,
      customerId: customer.id
    };
    setNewMapping({ ...newMapping, variations: updatedVariations });
    setCustomerDropdownOpen(null);
  };

  // Handle customer selection in the dialog
  const handleCustomerOptionSelectUpdate = (vIdx: number, customer: any) => {
    const updatedVariations = [...editMapping.variations];
    updatedVariations[vIdx] = {
      ...updatedVariations[vIdx],
      customerName: customer.name,
      customerId: customer.id,
      source: customer.name,
    };
    setEditMapping({ ...editMapping, variations: updatedVariations });
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="SKU Mapping" subtitle="Manage SKU variations and standard mappings" />
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>SKU Variation Mapping</CardTitle>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Mapping
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add New SKU Mapping</DialogTitle>
                        <DialogDescription>
                          Create a new mapping between a standard SKU and its variations.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="standard-sku">Standard SKU</Label>
                            <div className="relative">
                              <Input
                                id="standard-sku"
                                ref={skuInputRef}
                                value={newMapping.standardSku}
                                onChange={handleStandardSkuChange}
                                onFocus={() => setSkuDropdownOpen(skuOptions.length > 0)}
                                onBlur={() => { setTimeout(() => setSkuDropdownOpen(false), 100); }}
                                placeholder="e.g. CF226X"
                                autoComplete="off"
                              />
                              {skuDropdownOpen && (
                                <div className="absolute z-10 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow w-full max-h-48 overflow-auto" style={{overflow: 'auto'}}>
                                  {skuOptions.length > 0 ? (
                                    skuOptions.map((item: any) => (
                                      <div
                                        key={item?.sku}
                                        className="px-3 py-2 cursor-pointer hover:bg-muted dark:hover:bg-gray-700"
                                        onMouseDown={() => handleSkuOptionSelect(item.sku, item.description)}
                                      >
                                        <div className="font-medium dark:text-white">{item.sku}</div>
                                        <div className="text-xs text-muted-foreground dark:text-gray-400">{item.description}</div>
                                      </div>
                                    ))
                                  ) : newMapping.standardSku ? (
                                    <div className="px-3 py-2 text-muted-foreground dark:text-gray-400">No matches found</div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="standard-description">Description</Label>
                            <Input
                              id="standard-description"
                              value={newMapping.standardDescription}
                              onChange={(e) => setNewMapping({ ...newMapping, standardDescription: e.target.value })}
                              placeholder="e.g. HP 26X High Yield Black Toner"
                              readOnly={!!inventorySkus.find((item: any) => item.sku === newMapping.standardSku)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>SKU Variations</Label>
                          <div className="space-y-2 mt-2">
                            {newMapping.variations.map((variation, index) => (
                              <div key={index} className="flex gap-2">
                                <div className="relative w-2/5">
                                  <Input
                                    value={variation?.sku}
                                  onChange={(e) => {
                                    const updatedVariations = [...newMapping.variations]
                                    updatedVariations[index].sku = e.target.value
                                    setNewMapping({ ...newMapping, variations: updatedVariations })
                                  }}
                                    placeholder="Variation SKU"
                                    className="flex-1 min-w-0"
                                  />
                                </div>

                                <div className="relative w-3/5">
                                  <Input
                                    value={variation?.source}
                                    onChange={(e) => handleCustomerSourceChange(index, e.target.value)}
                                    onFocus={() => {
                                      const filtered = customers.filter((c: any) =>
                                        c.name && c.name.toLowerCase().includes(variation.source?.toLowerCase() || "")
                                      );
                                      const newOptions = [...customerOptions];
                                      newOptions[index] = filtered;
                                      setCustomerOptions(newOptions);
                                      setCustomerDropdownOpen(filtered.length > 0 ? index : null);
                                    }}
                                    onBlur={(e) => {
                                      // Only close if not clicking dropdown
                                      setTimeout(() => setCustomerDropdownOpen(null), 100);
                                    }}
                                    placeholder="Source (e.g. Customer)"
                                    className="flex-1 min-w-0"
                                    autoComplete="off"
                                  />
                                  {customerDropdownOpen === index && customerOptions[index]?.length > 0 && (
                                    <div className="absolute left-0 top-full z-10 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow w-full max-h-48 overflow-auto" style={{overflow: 'auto', width: '100%'}}>
                                      {customerOptions[index].map((c: any) => (
                                        <div
                                          key={c.id}
                                          className="px-3 py-2 cursor-pointer hover:bg-muted dark:hover:bg-gray-700"
                                          onMouseDown={() => handleCustomerOptionSelect(index, c)}
                                        >
                                          <div className="font-medium dark:text-white">{c.name}</div>
                                          <div className="text-xs text-muted-foreground dark:text-gray-400">{c.email}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeVariationFromNew(index)}
                                  disabled={newMapping.variations.length === 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addVariationToNew} className="mt-2">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Variation
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddMapping}>Save Mapping</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Bulk Actions
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Upload className="mr-2 h-4 w-4" />
                          Import Mappings
                        </DropdownMenuItem>
                        <DropdownMenuItem>Export Mappings</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search SKUs or variations..."
                      className="w-[300px] pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Mappings</TabsTrigger>
                    <TabsTrigger value="recent">Recently Added</TabsTrigger>
                    <TabsTrigger value="problematic">Problematic SKUs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="m-0">
                    <AllMappingsTab
                      mappings={filteredMappings}
                      isEditDialogOpen={isEditDialogOpen}
                      editMapping={editMapping}
                      setEditMapping={setEditMapping}
                      setIsEditDialogOpen={setIsEditDialogOpen}
                      isDeleteDialogOpen={isDeleteDialogOpen}
                      mappingToDelete={mappingToDelete}
                      setMappingToDelete={setMappingToDelete}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                      handleCustomerSourceChange={handleCustomerSourceChange}
                      customerOptions={customerOptions}
                      customerDropdownOpen={customerDropdownOpen}
                      setCustomerOptions={setCustomerOptions}
                      setCustomerDropdownOpen={setCustomerDropdownOpen}
                      customers={customers}
                      removeVariationFromEdit={removeVariationFromEdit}
                      addVariationToEdit={addVariationToEdit}
                      setMappings={setMappings}
                      handleDeleteMapping={handleDeleteMapping}
                      handleCustomerOptionSelectUpdate={handleCustomerOptionSelectUpdate}
                      // handleUpdateMapping={handleUpdateMapping}
                    />
                  </TabsContent>

                  <TabsContent value="recent" className="m-0">
                    <RecentlyAddedTab
                      mappings={mappings}
                      isEditDialogOpen={isEditDialogOpen}
                      editMapping={editMapping}
                      setEditMapping={setEditMapping}
                      setIsEditDialogOpen={setIsEditDialogOpen}
                      isDeleteDialogOpen={isDeleteDialogOpen}
                      mappingToDelete={mappingToDelete}
                      setMappingToDelete={setMappingToDelete}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                      handleCustomerSourceChange={handleCustomerSourceChange}
                      customerOptions={customerOptions}
                      customerDropdownOpen={customerDropdownOpen}
                      setCustomerOptions={setCustomerOptions}
                      setCustomerDropdownOpen={setCustomerDropdownOpen}
                      customers={customers}
                      removeVariationFromEdit={removeVariationFromEdit}
                      addVariationToEdit={addVariationToEdit}
                      setMappings={setMappings}
                      handleDeleteMapping={handleDeleteMapping}
                      handleCustomerOptionSelectUpdate={handleCustomerOptionSelectUpdate}
                      // handleUpdateMapping={handleUpdateMapping}
                    />
                  </TabsContent>

                  <TabsContent value="problematic" className="m-0">
                    <ProblematicSkusTab />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-muted-foreground">Drag and drop your CSV file here, or click to browse</div>
                      <Input type="file" className="hidden" id="file-upload" />
                      <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Browse Files
                      </Button>
                      <div className="text-xs text-muted-foreground">Supported format: CSV</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button disabled>Import</Button>
                    <Button variant="outline">Download Template</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SKU Analyzer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sku-analyze">Enter SKUs to analyze</Label>
                    <Textarea
                      id="sku-analyze"
                      placeholder="Enter one SKU per line to analyze and find potential matches"
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button>Analyze SKUs</Button>
                    <Button variant="outline">Clear</Button>
                  </div>
                  <div className="rounded-md border p-4 bg-muted/20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Paste SKUs from customer RFQs to find standard mappings</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
