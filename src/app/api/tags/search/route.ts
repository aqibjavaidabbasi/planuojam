import { NextRequest, NextResponse } from "next/server"
import QueryString from "qs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const locale = searchParams.get('locale') || 'en'
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Construct Strapi search URL using the same pattern as fetchAPI
    const strapiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/tags`
    const populate = '*'
    const filters = {
      filters: {
        name: {
          $containsi: query
        }
      },
      pagination: {
        limit: limit,
        start: 0
      }
    }

    // Build query string using QueryString like fetchAPI does
    const queryString = QueryString.stringify(
      {
        populate,
        locale,
        ...filters
      },
      { encodeValuesOnly: true }
    )

    const response = await fetch(`${strapiUrl}?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Search API Error Response:', errorText)
      throw new Error(`Failed to search tags: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data.data || [] })
  } catch (error) {
    console.error('Error searching tags:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search tags' },
      { status: 500 }
    )
  }
}
