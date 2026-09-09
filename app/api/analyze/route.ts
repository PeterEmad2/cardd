import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an image." },
        { status: 400 },
      );
    }

    // Convert uploaded image to FormData
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    // Your CarDD Python backend URL
    const backendUrl =
      process.env.CARDD_API_URL || "http://127.0.0.1:8000/analyze";

    const response = await fetch(backendUrl, {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("CarDD backend error:", errorText);

      return NextResponse.json(
        {
          error: "CarDD analysis failed.",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze image.",
      },
      { status: 500 },
    );
  }
}
