// === Heuristics Logic===
const API_KEY = 'jFIiv513heHILP8OLlAXxtqwJ-Ei8gw7dRY3tpWS.1SGtjdQXa7fwEN6w-NlLClV';
const API_URL = (domain) => `https://endpoint.apivoid.com/domainage/v1/pay-as-you-go/?key=${API_KEY}&host=${domain}`;

async function getDomainAge(domain) {
  try {
    const response = await fetch(API_URL(domain));
    const data = await response.json();
    if (!response.ok || data.error) return 0;
    return data.data.domain_age_in_days;
  } catch {
    return 0;
  }
}

export async function runHeuristicDetection(document = window.document) {
  const domain = location.hostname;
  let score = 0;
  let flags = 0;
  const maxScore = 60;

  // 🚨 HTTP only
  if (location.protocol !== 'https:') {
    score += 20;
    flags++;
  }

  // IP address
  if (domain.match(/\b\d{1,3}(\.\d{1,3}){3}\b/)) {
    score += 3;
    flags++;
  }

  // Too many hyphens
  if ((domain.match(/-/g) || []).length >= 3) {
    score += 2;
    flags++;
  }

  // Long domain
  if (domain.length > 30) {
    score += 2;
    flags++;
  }

  // Phishing keywords
  const phishingKeywords = ["login", "verify", "secure", "account", "update", "bank"];
  if (phishingKeywords.some(k => domain.includes(k))) {
    score += 2;
    flags++;
  }

  // Punycode
  if (domain.startsWith("xn--")) {
    score += 4;
    flags++;
  }

  // Suspicious TLDs
  const badTLDs = [".tk", ".ml", ".ga", ".cf", ".gq"];
  if (badTLDs.some(tld => domain.endsWith(tld))) {
    score += 2;
    flags++;
  }

  // Forms
  const forms = document.querySelectorAll("form");
  forms.forEach(form => {
    const action = form.action;
    if (action.startsWith("http:") && form.querySelector("input[type='password']")) {
      score += 4;
      flags++;
    }
    if (action && !action.includes(domain)) {
      score += 3;
      flags++;
    }
  });

  // Domain age
  const age = await getDomainAge(domain);
  if (age < 30) {
    score += 3;
    flags++;
  }

  const trustRating = Math.max(0, Math.round((1 - score / maxScore) * 100));

  let color = "green";
  let message = "✅ Appears Safe";

  if (flags >= 4) {
    color = "red";
    message = "❌ Don’t Trust This Website";
  } else if (flags >= 2) {
    color = "orange";
    message = "⚠️ Be Cautious";
  }

  return {
    domain,
    score,
    flags,
    trustRating,
    color,
    message
  };
}
