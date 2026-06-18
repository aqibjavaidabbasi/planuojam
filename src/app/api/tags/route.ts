import { NextRequest, NextResponse } from "next/server"
import QueryString from "qs"

/**
 * Find an existing tag by its exact name in the given locale.
 * Used to recover the real documentId when a create fails on the unique-name
 * constraint, so we never persist a raw name string as a tag id.
 */
async function findTagByName(name: string, locale?: string | null) {
  try {
    const queryString = QueryString.stringify(
      {
        filters: { name: { $eqi: name } },
        ...(locale ? { locale } : {}),
        pagination: { limit: 1 },
      },
      { encodeValuesOnly: true },
    )
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tags?${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0] || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale')
    
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/tags`
    if (locale) {
      url += `?locale=${encodeURIComponent(locale)}`
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch tags')
    }
    
    const data = await response.json()
    return NextResponse.json({ success: true, data: data.data })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale')
    const { name } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/tags`
    if (locale) {
      url += `?locale=${encodeURIComponent(locale)}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          name: trimmedName,
        },
      }),
    })

    if (!response.ok) {
      // Tag names are unique, so a failure here is most likely a duplicate.
      // Resolve the existing tag by name so callers always get a real documentId
      // instead of falling back to storing the raw name.
      const existing = await findTagByName(trimmedName, locale)
      if (existing) {
        return NextResponse.json({ success: true, data: existing })
      }

      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: errorData.error?.message || 'Failed to create tag' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data.data })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
