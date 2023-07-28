import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import axios from 'axios';
import * as fs from 'fs'


function readLocalJSON() {
    try {
      // Read local JSON
      const data = fs.readFileSync('clark-county-streets.json', 'utf-8');
      
      // JSON object
      const jsonData = JSON.parse(data);
      
      // Check if the object is an array and not empty
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        // Use a set to store unique streets while processing
        const uniqueStreetsSet = new Set();
  
        // Process each street in the array to get only the name
        jsonData.forEach(street => {
          // Remove the ZIP code (5 digits at the end) using a regular expression
          const streetName = street.replace(/\s+\d{5}$/, '');
          
          // Remove the leading number and the ordinal suffix (th, st, nd, rd) if any
          const cleanedStreetName = streetName.replace(/^\d+\s*?(st|nd|rd|th)?\s*/, '');
          
          // Add the cleaned street name to the set (duplicates will not be automatically added)
          uniqueStreetsSet.add(cleanedStreetName);
        });
  
        // Convert the set to an array and return it
        return Array.from(uniqueStreetsSet);
      } else {
        console.log('The JSON does not contain valid data.');
        return []; // Return an empty array if there is no valid data
      }
    } catch (error) {
      console.error('Error while reading the JSON file:', error.message);
      return []; // Return an empty array in case of an error
    }
  }
  




async function getParcelsFromStreet() {
    try {
        const res = await fetch("https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/site.aspx", {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "es-ES,es;q=0.9",
                "cache-control": "max-age=0",
                "content-type": "application/x-www-form-urlencoded",
                "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "cookie": "_gid=GA1.2.1765594136.1690433499; _ga_1NNBW3Q56L=GS1.1.1690433549.2.1.1690434261.0.0.0; __utma=264610653.339704305.1690323020.1690437510.1690437510.1; __utmz=264610653.1690437510.1.1.utmcsr=maps.clarkcountynv.gov|utmccn=(referral)|utmcmd=referral|utmcct=/; _ga=GA1.2.339704305.1690323020; _ga_1RDDBGSMQW=GS1.1.1690507516.4.0.1690507539.0.0.0",
                "Referer": "https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/site.aspx",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": "__LASTFOCUS=&__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATE=%2FwEPDwULLTExMzk0OTE3OTcPZBYCAgMPZBYCAgMPDxYCHgdWaXNpYmxlaGQWBAIBDzwrABECARAWABYAFgAMFCsAAGQCAw8PZA8QFgZmAgECAgIDAgQCBRYGFgIeDlBhcmFtZXRlclZhbHVlZRYCHwEFC3Vuc3BlY2lmaWVkFgIfAWUWAh8BBQt1bnNwZWNpZmllZBYCHwEFC3Vuc3BlY2lmaWVkFgIfAWgWBmZmZmZmZmRkGAIFHl9fQ29udHJvbHNSZXF1aXJlUG9zdEJhY2tLZXlfXxYEBQ1jaGtJc1Bob25ldGljBQlyZEN1cnJlbnQFCXJkSGlzdG9yeQUJcmRIaXN0b3J5BQZndkxpc3QPZ2S5GYyAC3R9OyWcesNdsbRfzOUlWPbONJGWJoxPv2KMng%3D%3D&__VIEWSTATEGENERATOR=9E8EB7AE&__EVENTVALIDATION=%2FwEdAFGiSkRLZWFcqVPUb4aluMDFgF8O4AJumzPysE5Uk0GlrNPYYcNdICitbmnVDSfsT40IdP%2F%2BCsvS5lgAPYwTFI31I49nm9KCZ8JkHf1tNzNAGseeyHtAF07zXz%2FYgchAWaSpurSoZOL0KyKsknhu0Y28ozoJZpuXxkpOVJKRbHyuHu9ph3uKnTkmln3RAB6HCtOfP%2BaljwQfr8xEAuNmqxG92q%2F9wroA1D3HWOUWOa1os4GYADOQS5T%2FCl%2Fk8leSZNaGePNNs2KxAFAoZoCCFsXlICgn3tc%2Bjs5UQeR9ZKDAv0J%2Fkb2dAKR%2BhZ1y4kS4aA4bDHv%2Bp05lUMFlSjaKWvImjZFOVigmnkNHbEOXSNY29zLAPmlezcoXsDJ8g13cgrN7Qbn5tboe%2B9ryUomg%2FJPBbHGfLyaYqxDgXHcqrQFeuMp3nD7Ef076X2JOA6T7EjHcgtwwJXGVSpaeq9EwopBx99BiB0R9Q8AZRWETkQP3smWC%2FNCJ%2Bhk12NqbSfs%2BvImI7xq3qcIyzHQHftqg4qbwL5cu1egJ86Q6qe0LD7%2FCGd0P3QfljGrJNZJkKa4KN0w4%2BIQuGCtGpzyKqfzhi7gyMsJr5k0Wx9CyhtYQU51sZi%2BX%2FgK69ZC%2Fiso8ECJ9PS0NtUoCu0UJCfTw1xdRjoXk5wWYX9ooU63ew0iwQsjjaHWfcF%2B0qw1JnfBRQVU8VENGKWYZRBb52YSESZO5R%2Bq4CHo9WHlEo0nmYkavbAI5Ihax5UgaX5n8xPySCwhOsxVKQaXqr3P7s%2BJzU9X6KYqzjxDCJS9fqbL39C9aoA5YNLJaMtSQ%2F3LSITVl9a7jbWSO%2B2ed3LfTRoYnYu42vJnDPdTvQVdnjsgG5MjZrywYh1pUX1n6xTuSFTLubk5kG3NDnp7ZBVwl7sIUVgJLeKdhUf97nW8POkHgOeuaMu%2BYHxCgSxDJUFg4tC%2BKPHH5DucqriI3t02GmvZ7hlBwTqVJ5rTEGh1tOHDwSNeZLt%2BGD%2FUbEbzDIibYvuhtvObcQLrVfnGl73vJW2u9kNs%2F3I6m7Tb3Fx0Fj3sWkYF2kDjSRJaFeP%2FunkecoRD2n3V%2BwLBsKTsGEi7m8ncDbWL8AIw0T7qKYJoKWUOoeJTCPsT6pp0TFA72yUOsAjAdCL0bZCPONvAZhHXaOseZQOtsH9YKQTvGXOjk2KIdjxa7pS3wHKulhT5xKTN6%2BojLtYeGukUxTBiImYJzswqV5BRhZlI%2FXSOsXjiffkCCnld33ZEdewWqx3AKJmD%2BMK%2BsP1gbkx%2Fbh8Wxgmm1OpyaYM2xcglwGGgcyrxGLbKj4HqS%2BtilYLw%2FsyLMRaU5OK%2FGaz5WqBqPH7XULF3WVGCHjNoNrMJS6dlRZPTGrFGJ3lkEumelQbW5lDFo6hW%2Ft%2Bg4rjn%2BQuN1Ne62cabzV8AWjJdKhhnC82uIS9InXrAzKCBaH8%2BRT6sOvOira9lgYfyt9BcYb1ICVVSUWliO9K5BeBPFlF7FOcQI5Xt5o8L%2B%2F1W3csrWeGlc1r%2FYyOY0%2F2o1%2BwVuM4c43pwaODpU4BT6PPpR4eVrJsRjBDx3yWz3ODrSc%2Fgc6oRJJNk5PrbJzE%2ByvvQXdIxKQIzKBdUXAYZvT55GPhpALqu2hGxYvttbJgP9lv3ur9BVll7wjpal%2FnhgFD3YosNI3Wd0aeYIXLuCTtDQXJWc6UP52HEw1j2VRrOOz1uMTTzmltaUM7aEAN%2Bg9cP%2Fm13k%2FjGQiSuddq7xW3466UkjevHCEJS7Q3%2Bbp9lFq2Zq9Q%3D%3D&txtNumber=&lstDirection=unspecified&txtName=Circle&lstType=unspecified&lstCity=unspecified&r1=rdCurrent&btnSubmit=Submit",
            "method": "POST"
        });
        const html = await res.text()
        findResultsPage(html);
    } catch (e) {
        console.log(`error in getParcelsFromStreet ${e.message}`)
    }
}

async function findResultsPage(html) {
    var results = [];
    const $ = cheerio.load(html);
    const rows = $("#pnlList").find("tr");
    rows.each((i, row) => {
      if (i === 0) return;
      const address = $(row).find("td").text().trim()?.split("  ").join(" ");
      const city = $(row).find("td").eq(1).text().trim();
      const parcelNumber = $(row).find("td").eq(2).text().trim();
  
      results.push({
        address,
        city,
        parcelNumber
      });
    });
  
    // Save the data to a CSV file if the object has any value in parcelNumber
    const filteredResults = results.filter(result => result.parcelNumber);
    if (filteredResults.length > 0) {
      const csvData = filteredResults.map(result => `${result.address},${result.city},${result.parcelNumber}`).join('\n');
  
      // Use fs.writeFileSync with 'a' flag for appending data to the existing file
      fs.writeFileSync('clarkcounty.csv', csvData, { encoding: 'utf-8', flag: 'a' });
  
      console.log('Data saved to clarkcounty.csv');
    }
  
    return results; // Return the array of results
  }
  
  async function getSearchResults(street) {
    try {
      const all = [];
      let results = [1];
      let pageNumber = 1;
  
      const res1 = await axios.get("https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/site.aspx");
      const html1 = res1.data;
      const $1 = cheerio.load(html1);
      let __VIEWSTATE = $1("#__VIEWSTATE").val();
      let __VIEWSTATEGENERATOR = $1("#__VIEWSTATEGENERATOR").val();
      let __EVENTVALIDATION = $1("#__EVENTVALIDATION").val();
  
      while (results.length) {
        let body = `__LASTFOCUS=&__EVENTTARGET=${pageNumber !== 1 ? "gvList" : ""}&__EVENTARGUMENT=${encodeURIComponent(
          `Page$${pageNumber}`
        )}&__VIEWSTATE=${encodeURIComponent(__VIEWSTATE)}&__VIEWSTATEGENERATOR=${encodeURIComponent(
          __VIEWSTATEGENERATOR
        )}&__EVENTVALIDATION=${encodeURIComponent(__EVENTVALIDATION)}`;
  
        if (pageNumber === 1) {
          body += `&txtNumber=&lstDirection=unspecified&txtName=${encodeURIComponent(
            street
          )}&lstType=unspecified&lstCity=unspecified&r1=rdCurrent&btnSubmit=Submit`;
        }
        console.log(pageNumber);
  
        const res = await fetch("https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/site.aspx", {
          "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "es-ES,es;q=0.9",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": "_gid=GA1.2.1765594136.1690433499; _ga_1NNBW3Q56L=GS1.1.1690433549.2.1.1690434261.0.0.0; __utma=264610653.339704305.1690323020.1690437510.1690437510.1; __utmz=264610653.1690437510.1.1.utmcsr=maps.clarkcountynv.gov|utmccn=(referral)|utmcmd=referral|utmcct=/; _ga=GA1.2.339704305.1690323020; _ga_1RDDBGSMQW=GS1.1.1690507516.4.0.1690507539.0.0.0",
            "Referer": "https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/site.aspx",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          body,
          "method": "POST"
        });
  
        const html = await res.text();
        results = await findResultsPage(html); // Update results with the call to findResultsPage
        all.push(...results);
        pageNumber++;
  
        const $ = cheerio.load(html);
        __VIEWSTATE = $("#__VIEWSTATE").val();
        __VIEWSTATEGENERATOR = $("#__VIEWSTATEGENERATOR").val();
        __EVENTVALIDATION = $("#__EVENTVALIDATION").val();
      }
  
      return all;
    } catch (e) {
      console.log(e.message);
    }
  }
  
const streets = readLocalJSON();
(async () => {
    const streets = readLocalJSON();
    for (const street of streets) {
      console.log(`Processing street: ${street}`);
      const results = await getSearchResults(street);
  
      // Here you can perform any action with the results obtained for each street
      // For example, storing them in a database, saving them to a file, etc.
      console.log(`Results for ${street}:`);
      console.log(results);
    }
    // const results = await getSearchResults()
    // console.log(results)
  })();
  
// getParcelsFromStreet();


// async function navigateWebPage() {
//     const browser = await puppeteer.launch({ headless: false }); // Modo no headless
//     const page = await browser.newPage();

//     try {
//         await Promise.race([
//             page.goto('https://geographic.org/streetview/usa/nv/clark/las_vegas.html', { timeout: 600000 }), // Tiempo de espera aumentado a 60 segundos
//             new Promise(resolve => setTimeout(resolve, 60000)) // Tiempo máximo de espera
//         ]);

//         const titles = await page.evaluate(() => {
//             const elementosConClase = document.querySelectorAll("li");
//             const titlesArray = [];

//             // Iterar sobre la lista de elementos y obtener el texto interno de cada uno
//             elementosConClase.forEach((elemento) => {
//                 const textoElemento = elemento.innerText;
//                 titlesArray.push(textoElemento);
//             });

//             return titlesArray;
//         });

//         // Imprime el resultado en la consola
//         titles.forEach((title) => {
//             console.log(title);
//         });

//         const dataToWrite = JSON.stringify(titles, null, 2);
//         await fs.writeFile('clark-county-streets.json', dataToWrite, 'utf8');
//     } catch (error) {
//         console.error("Ocurrió un error durante la navegación:", error);
//     } finally {
//         await browser.close();
//     }
// }
