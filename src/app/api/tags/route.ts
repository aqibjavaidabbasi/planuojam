import { NextRequest, NextResponse } from "next/server"

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
          name: name.trim(),
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
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
