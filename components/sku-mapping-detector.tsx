"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Check, Edit, X } from "lucide-react"

interface SkuMappingDetectorProps {
  skus: string[]
  onMapSkus: (mappings: { original: string; mapped: string }[]) => void
}

interface SkuSuggestion {
  original: string
  suggested: string
  description: string
  confidence: number
}

export function SkuMappingDetector({ skus, onMapSkus }: SkuMappingDetectorProps) {
  const [suggestions, setSuggestions] = useState<SkuSuggestion[]>([
    {
      original: "HP26X",
      suggested: "CF226X",
      description: "HP 26X High Yield Black Toner Cartridge",
      confidence: 98,
    },
    {
      original: "HP-55-X",
      suggested: "CE255X",
      description: "HP 55X High Yield Black Toner Cartridge",
      confidence: 95,
    },
  ])

  const [selectedMappings, setSelectedMappings] = useState<{ [key: string]: string }>({})
  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")

  const handleAcceptSuggestion = (original: string, suggested: string) => {
    setSelectedMappings({
      ...selectedMappings,
      [original]: suggested,
    })
  }

  const handleRejectSuggestion = (original: string) => {
    const newMappings = { ...selectedMappings }
    delete newMappings[original]
    setSelectedMappings(newMappings)
  }

  const handleEditSuggestion = (original: string, suggested: string) => {
    setEditingSuggestion(original)
    setEditValue(suggested)
  }

  const handleSaveEdit = (original: string) => {
    if (editValue.trim()) {
      setSelectedMappings({
        ...selectedMappings,
        [original]: editValue.trim(),
      })
    }
    setEditingSuggestion(null)
  }

  const handleApplyMappings = () => {
    const mappings = Object.entries(selectedMappings).map(([original, mapped]) => ({
      original,
      mapped,
    }))
    onMapSkus(mappings)
  }

  // If no non-standard SKUs are detected, don't render the component
  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Non-Standard SKUs Detected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            We've detected some non-standard SKUs in this RFQ. Review the suggested mappings below.
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.original} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{suggestion.original}</span>
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300">
                      Non-Standard
                    </Badge>
                  </div>
                  {editingSuggestion === suggestion.original ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                        placeholder="Enter SKU"
                      />
                      <Button variant="outline" size="sm" onClick={() => handleSaveEdit(suggestion.original)}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingSuggestion(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Suggested mapping:{" "}
                        <span className="font-medium">
                          {selectedMappings[suggestion.original] || suggestion.suggested}
                        </span>{" "}
                        ({suggestion.description})
                      </div>
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className={`${
                            suggestion.confidence >= 90 
                              ? "bg-green-50 dark:bg-green-950/30 dark:text-green-300" 
                              : "bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300"
                          }`}
                        >
                          {suggestion.confidence}% Match
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingSuggestion === suggestion.original ? null : selectedMappings[suggestion.original] ? (
                    <>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Accepted</span>
                      <Button variant="ghost" size="icon" onClick={() => handleRejectSuggestion(suggestion.original)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptSuggestion(suggestion.original, suggestion.suggested)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSuggestion(suggestion.original, suggestion.suggested)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onMapSkus([])}>
              Skip
            </Button>
            <Button onClick={handleApplyMappings} disabled={Object.keys(selectedMappings).length === 0}>
              Apply Mappings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
