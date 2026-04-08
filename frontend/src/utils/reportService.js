/*
© Copyright 2026 Mohit Pal
Licensed under the MIT;
you may not use this file except in compliance with the License.
SPDX-License-Identifier: MIT
*/
export const generateReport = async (section, data, format = "pdf") => {

    const response = await fetch("/api/report", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            section: section,
            data: data,
            format: format
        })
    });

    if (!response.ok) {
        throw new Error("Report generation failed");
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    window.open(url);
};