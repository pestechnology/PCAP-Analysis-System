export async function analyzePCAP(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error("Backend error");
    }

    return response.json();
}
