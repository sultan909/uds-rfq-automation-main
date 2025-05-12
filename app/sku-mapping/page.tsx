"use client"

import { useState } from "react"
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

// Sample data for SKU mappings
const initialMappings = [
  {
    id: 1,
    standardSku: "CF226X",
    standardDescription: "HP 26X High Yield Black Toner Cartridge",
    variations: [
      { id: 1, sku: "HP26X", source: "Tech Solutions Inc" },
      { id: 2, sku: "HP-26-X", source: "ABC Electronics" },
      { id: 3, sku: "CF-226-X", source: "Global Systems" },
    ],
  },
  {
    id: 2,
    standardSku: "CE255X",
    standardDescription: "HP 55X High Yield Black Toner Cartridge",
    variations: [
      { id: 4, sku: "HP55X", source: "Tech Solutions Inc" },
      { id: 5, sku: "HP-55-X", source: "Midwest Distributors" },
    ],
  },
  {
    id: 3,
    standardSku: "CC364X",
    standardDescription: "HP 64X High Yield Black Toner Cartridge",
    variations: [
      { id: 6, sku: "HP64X", source: "Tech Solutions Inc" },
      { id: 7, sku: "HP-64-X", source: "ABC Electronics" },
      { id: 8, sku: "CC-364-X", source: "Global Systems" },
    ],
  },
  {
    id: 4,
    standardSku: "Q2612A",
    standardDescription: "HP 12A Black Toner Cartridge",
    variations: [
      { id: 9, sku: "HP12A", source: "Tech Solutions Inc" },
      { id: 10, sku: "HP-12-A", source: "ABC Electronics" },
    ],
  },
  {
    id: 5,
    standardSku: "CE505X",
    standardDescription: "HP 05X High Yield Black Toner Cartridge",
    variations: [
      { id: 11, sku: "HP05X", source: "Tech Solutions Inc" },
      { id: 12, sku: "HP-05-X", source: "Midwest Distributors" },
    ],
  },
]

export default function SkuMapping() {
  const [mappings, setMappings] = useState(initialMappings)
  const [searchTerm, setSearchTerm] = useState("")
  const [newMapping, setNewMapping] = useState({
    standardSku: "",
    standardDescription: "",
    variations: [{ sku: "", source: "" }],
  })
  const [editMapping, setEditMapping] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [mappingToDelete, setMappingToDelete] = useState<number | null>(null)

  // Filter mappings based on search term
  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.standardSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.standardDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.variations.some(
        (v) =>
          v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.source.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )

  // Add a new mapping
  const handleAddMapping = () => {
    const newId = Math.max(...mappings.map((m) => m.id), 0) + 1
    const variationsWithIds = newMapping.variations.map((v, index) => ({
      ...v,
      id: Math.max(...mappings.flatMap((m) => m.variations.map((v) => v.id)), 0) + index + 1,
    }))

    setMappings([
      ...mappings,
      {
        ...newMapping,
        id: newId,
        variations: variationsWithIds,
      },
    ])

    setNewMapping({
      standardSku: "",
      standardDescription: "",
      variations: [{ sku: "", source: "" }],
    })

    setIsAddDialogOpen(false)
  }

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
      variations: [...newMapping.variations, { sku: "", source: "" }],
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

    const newId = Math.max(...mappings.flatMap((m) => m.variations.map((v) => v.id)), 0) + 1

    setEditMapping({
      ...editMapping,
      variations: [...editMapping.variations, { id: newId, sku: "", source: "" }],
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
                            <Input
                              id="standard-sku"
                              value={newMapping.standardSku}
                              onChange={(e) => setNewMapping({ ...newMapping, standardSku: e.target.value })}
                              placeholder="e.g. CF226X"
                            />
                          </div>
                          <div>
                            <Label htmlFor="standard-description">Description</Label>
                            <Input
                              id="standard-description"
                              value={newMapping.standardDescription}
                              onChange={(e) => setNewMapping({ ...newMapping, standardDescription: e.target.value })}
                              placeholder="e.g. HP 26X High Yield Black Toner"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>SKU Variations</Label>
                          <div className="space-y-2 mt-2">
                            {newMapping.variations.map((variation, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={variation.sku}
                                  onChange={(e) => {
                                    const updatedVariations = [...newMapping.variations]
                                    updatedVariations[index].sku = e.target.value
                                    setNewMapping({ ...newMapping, variations: updatedVariations })
                                  }}
                                  placeholder="Variation SKU"
                                  className="flex-1"
                                />
                                <Input
                                  value={variation.source}
                                  onChange={(e) => {
                                    const updatedVariations = [...newMapping.variations]
                                    updatedVariations[index].source = e.target.value
                                    setNewMapping({ ...newMapping, variations: updatedVariations })
                                  }}
                                  placeholder="Source (e.g. Customer)"
                                  className="flex-1"
                                />
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
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">
                              <div className="flex items-center gap-1">
                                Standard SKU
                                <ArrowUpDown className="h-4 w-4" />
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1">
                                Description
                                <ArrowUpDown className="h-4 w-4" />
                              </div>
                            </TableHead>
                            <TableHead>Variations</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMappings.map((mapping) => (
                            <TableRow key={mapping.id}>
                              <TableCell className="font-medium">{mapping.standardSku}</TableCell>
                              <TableCell>{mapping.standardDescription}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {mapping.variations.map((variation) => (
                                    <Badge key={variation.id} variant="outline" className="flex items-center gap-1">
                                      {variation.sku}
                                      <span className="text-xs text-muted-foreground">({variation.source})</span>
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Dialog
                                    open={isEditDialogOpen && editMapping?.id === mapping.id}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setEditMapping(mapping)
                                      }
                                      setIsEditDialogOpen(open)
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[600px]">
                                      <DialogHeader>
                                        <DialogTitle>Edit SKU Mapping</DialogTitle>
                                        <DialogDescription>
                                          Update the mapping between a standard SKU and its variations.
                                        </DialogDescription>
                                      </DialogHeader>
                                      {editMapping && (
                                        <div className="grid gap-4 py-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label htmlFor="edit-standard-sku">Standard SKU</Label>
                                              <Input
                                                id="edit-standard-sku"
                                                value={editMapping.standardSku}
                                                onChange={(e) =>
                                                  setEditMapping({ ...editMapping, standardSku: e.target.value })
                                                }
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="edit-standard-description">Description</Label>
                                              <Input
                                                id="edit-standard-description"
                                                value={editMapping.standardDescription}
                                                onChange={(e) =>
                                                  setEditMapping({
                                                    ...editMapping,
                                                    standardDescription: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                          </div>

                                          <div>
                                            <Label>SKU Variations</Label>
                                            <div className="space-y-2 mt-2">
                                              {editMapping.variations.map((variation: any) => (
                                                <div key={variation.id} className="flex gap-2">
                                                  <Input
                                                    value={variation.sku}
                                                    onChange={(e) => {
                                                      const updatedVariations = [...editMapping.variations]
                                                      const index = updatedVariations.findIndex(
                                                        (v) => v.id === variation.id,
                                                      )
                                                      updatedVariations[index].sku = e.target.value
                                                      setEditMapping({ ...editMapping, variations: updatedVariations })
                                                    }}
                                                    placeholder="Variation SKU"
                                                    className="flex-1"
                                                  />
                                                  <Input
                                                    value={variation.source}
                                                    onChange={(e) => {
                                                      const updatedVariations = [...editMapping.variations]
                                                      const index = updatedVariations.findIndex(
                                                        (v) => v.id === variation.id,
                                                      )
                                                      updatedVariations[index].source = e.target.value
                                                      setEditMapping({ ...editMapping, variations: updatedVariations })
                                                    }}
                                                    placeholder="Source (e.g. Customer)"
                                                    className="flex-1"
                                                  />
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeVariationFromEdit(variation.id)}
                                                    disabled={editMapping.variations.length === 1}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              ))}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={addVariationToEdit}
                                                className="mt-2"
                                              >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Variation
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button onClick={handleUpdateMapping}>Update Mapping</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog
                                    open={isDeleteDialogOpen && mappingToDelete === mapping.id}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setMappingToDelete(mapping.id)
                                      }
                                      setIsDeleteDialogOpen(open)
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Delete SKU Mapping</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete this SKU mapping? This action cannot be
                                          undone.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button variant="destructive" onClick={handleDeleteMapping}>
                                          Delete
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="recent" className="m-0">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Standard SKU</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Variations</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* This would show recently added mappings */}
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No recent mappings found
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="problematic" className="m-0">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Problematic SKU</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Suggested Mapping</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">HP-26X-TONER</TableCell>
                            <TableCell>New Customer Inc.</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>CF226X (HP 26X High Yield Black Toner)</span>
                                <Badge variant="outline" className="bg-green-50">
                                  98% Match
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm">
                                  <Check className="mr-2 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">HP55-X-BLK</TableCell>
                            <TableCell>Office Supplies Ltd.</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>CE255X (HP 55X High Yield Black Toner)</span>
                                <Badge variant="outline" className="bg-green-50">
                                  95% Match
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm">
                                  <Check className="mr-2 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
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
