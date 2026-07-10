import { NextResponse } from "next/server";

/**
 * Page-scoped banner assignments are no longer supported.
 * Each shop has one live press-strip design.
 */
export function GET() {
  return NextResponse.json(
    {
      error:
        "Banner page assignments are no longer supported. Presswall uses a single shop-wide design.",
    },
    { status: 410 }
  );
}

export function PUT() {
  return NextResponse.json(
    {
      error:
        "Banner page assignments are no longer supported. Presswall uses a single shop-wide design.",
    },
    { status: 410 }
  );
}

export function DELETE() {
  return NextResponse.json(
    {
      error:
        "Banner page assignments are no longer supported. Presswall uses a single shop-wide design.",
    },
    { status: 410 }
  );
}
