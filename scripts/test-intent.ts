import { DiscoveryService } from '../src/blast/discovery-service'

async function testIntentScoring() {
  const service = new DiscoveryService()
  
  const tests = [
    { text: "Berapa harganya bang?", expected: "High" },
    { text: "Saya mau beli jasa website UMKM", expected: "High" },
    { text: "Rekomendasi toko sepatu dong", expected: "High" },
    { text: "Info harga min", expected: "High" },
    { text: "Mantap pak", expected: "Low" },
    { text: "Ini nipu gak ya?", expected: "Negative" },
    { text: "Mana link belinya?", expected: "Medium/High" }
  ]

  console.log('--- Intent Scoring Test ---')
  for (const t of tests) {
    const score = service.scoreIntent(t.text)
    console.log(`Text: "${t.text}" | Score: ${score} | Expected: ${t.expected}`)
  }
}

testIntentScoring().catch(console.error)
