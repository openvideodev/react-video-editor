import { type NextRequest, NextResponse } from "next/server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(req: NextRequest) {
  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: "PEXELS_API_KEY is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "image";
  const query = searchParams.get("query");
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "20";

  let url = "";
  if (type === "image") {
    url = query
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
      : `https://api.pexels.com/v1/curated?page=${page}&per_page=${perPage}`;
  } else {
    url = query
      ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
      : `https://api.pexels.com/videos/popular?page=${page}&per_page=${perPage}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch from Pexels" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pexels API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
