async function getDomainAge(domain) {
  const apiKey = 'jFIiv513heHILP8OLlAXxtqwJ-Ei8gw7dRY3tpWS.1SGtjdQXa7fwEN6w-NlLClV'; 
  const apiUrl = `https://endpoint.apivoid.com/domainage/v1/pay-as-you-go/?key=${apiKey}&host=${domain}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (!response.ok || data.error) return 0;
    return data.data.domain_age_in_days;
  } catch (error) {
    return 0;
  }
}

export async function runHeuristicDetection(document) {
  let score = 0;
  const domain = location.hostname;

  // Heuristic 1: IP in domain
  if (domain.match(/\b\d{1,3}(\.\d{1,3}){3}\b/)) score += 3;

  // Heuristic 2: Too many hyphens
  if ((domain.match(/-/g) || []).length >= 3) score += 2;

  // Heuristic 3: Not HTTPS
  if (location.protocol !== 'https:') score += 4;

  // Heuristic 4: Insecure password forms
  const forms = document.querySelectorAll("form");
  forms.forEach(form => {
    if (form.action.startsWith("http:") && form.querySelector("input[type='password']")) {
      score += 4;
    }
  });

  // Heuristic 5: Domain age
  const age = await getDomainAge(domain);
  if (age < 30) score += 3;

  // Calculate trust rating (out of 100)
  const maxScore = 16;
  const trustRating = Math.max(0, Math.round((1 - score / maxScore) * 100));
  const status = score >= 5 ? "phishing" : "safe";

  let color = "green";
  if (trustRating < 70) color = "yellow";
  if (trustRating < 40) color = "red";

  return {
    status,
    score,
    trustRating,
    color
  };
}
