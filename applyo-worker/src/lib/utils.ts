export async function verifyEmail(email: string, env: { ZEROBOUNCE_API_KEY: string }): Promise<string> {
    const apiKey = env.ZEROBOUNCE_API_KEY;
    const url = `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}`;

    const response = await fetch(url);

    console.log("the response: ", response)
    const data = await response.json() as {
        address: string;
        status: string;
        sub_status: string;
        account: string;
        domain: string;
        did_you_mean: string;
        domain_age_days: string;
        free_email: boolean;
        mx_found: boolean;
        mx_record: string;
        smtp_provider: string;
        firstname: string;
        lastname: string;
        gender: string;
        country: string;
        region: string;
        city: string;
        zipcode: string;
        processed_at: string;
    };

    console.log("ZeroBounce verification result:", data);

    return data.status;
}
