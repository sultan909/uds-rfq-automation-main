"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"

export default function ThemeDemo() {
  const { theme } = useTheme()
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Theme Demo" subtitle={`Current theme: ${theme}`} />
        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Card Component</CardTitle>
                <CardDescription>
                  This card demonstrates the theme styling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">The current theme is: {theme}</p>
                <Button className="mr-2">Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>
                  Forms with theme support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="user">Regular User</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tabs Component</CardTitle>
                <CardDescription>
                  Tabs with theme support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="account">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account" className="mt-4">
                    <p>Account settings and preferences will appear here.</p>
                  </TabsContent>
                  <TabsContent value="password" className="mt-4">
                    <p>Password change form would go here.</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Theme Variables Sample</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ThemeColorSample name="Background" className="bg-background text-foreground" />
              <ThemeColorSample name="Foreground" className="bg-foreground text-background" />
              <ThemeColorSample name="Primary" className="bg-primary text-primary-foreground" />
              <ThemeColorSample name="Secondary" className="bg-secondary text-secondary-foreground" />
              <ThemeColorSample name="Card" className="bg-card text-card-foreground" />
              <ThemeColorSample name="Muted" className="bg-muted text-muted-foreground" />
              <ThemeColorSample name="Accent" className="bg-accent text-accent-foreground" />
              <ThemeColorSample name="Destructive" className="bg-destructive text-destructive-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ThemeColorSampleProps {
  name: string
  className: string
}

function ThemeColorSample({ name, className }: ThemeColorSampleProps) {
  return (
    <div className={`p-4 rounded-md ${className}`}>
      <p className="font-medium">{name}</p>
    </div>
  )
}
