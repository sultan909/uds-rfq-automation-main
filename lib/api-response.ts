import { NextResponse } from "next/server"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export function createSuccessResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<null>> {
  console.error(error)
  const message = error instanceof Error ? error.message : "An unexpected error occurred"
  return NextResponse.json({ success: false, message }, { status: 500 })
} 