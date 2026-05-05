import axios from 'axios';

async function main() {
  const url = "https://static.xx.fbcdn.net/rsrc.php/v4id2B4/y_/l/id_ID-j/6fL_h9NPhFNYfpB7vKSHBshs6UgS8sQOEGoD6pcQSN4UTM1yGuSvB7re3vI0swwsT8yUjANfcBYuLuOTnVIKnUgP66hBIpYVSGQiCx8X3PaJuzojPBhSvjstypdjan7nloX2UnxmCIku4_yKjR9CQlX0UvLpE1piIX7VuhV6bw9tU1xZHGmQlxOYCYTVddQfcSnONyj_F4br9-_FIKuxOTTzCYFO6M3bOH45CSrlr7aDhzzU_biaKKHxEKz9vx9FiSobW7aMIBFOwarnLoTppGp9ZURbdH.js?_nc_eui2=AeEwihNxOcd4JHpaClcRu_KVSj1IfKQ0mS5KPUh8pDSZLvik1TISX1xPPf1KvaBAoPK5mfkrhcBMWP4PmRj4VPPO";
  const res = await axios.get(url);
  const js = res.data as string;
  const idx = js.indexOf('SearchCometResultsInitialResultsQuery');
  if (idx !== -1) {
    console.log("From first file:", js.substring(idx, idx + 300));
  }
  
  const url2 = "https://static.xx.fbcdn.net/rsrc.php/v4ik6v4/yQ/l/id_ID-j/aWR1yPI6oXc32Jp7wUZU14HRmb5JjlvNIL4p58RaPc0Jb2UKxhnUtIMnHe7IyeTytyIwVkcu9-ZXFVo8-7q2kjwKbQURNzbw4xPFRcUupB4fa-UNViX7Cuc1cI-xNkOG0ZsH3mmd_uLiXZVoqBzo8wVwYxV2Uwya2mKhzWjoicn5iioLnw_B7jej8yZsN3TUnncrlyB5bIoMrIaeQe8B8lT4IOlQ7XzghIEFKxfdRXtYLmavxO-Qx8lcabVTDsc55n7NBS09O7vZAwigA0bJZCcc2ZP1MquYQLzwqm8BXZTFDSp4bWABAdmh5DEndjkKeHWrECl3_n.js?_nc_eui2=AeG8ty-xAwOkyG-nOhlmRzZAbGbO8gULLz1sZs7yBQsvPTmjVcJjzAZaOdZTkslPujoCAWlHHVA9zwu1paVE2tP5";
  const res2 = await axios.get(url2);
  const js2 = res2.data as string;
  const idx2 = js2.indexOf('SearchCometResultsInitialResultsQuery');
  if (idx2 !== -1) {
    console.log("From second file:", js2.substring(idx2, idx2 + 300));
  }
}
main();
