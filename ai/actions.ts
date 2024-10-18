import { generateObject } from "ai";
import { z } from "zod";

import { geminiFlashModel } from ".";

export async function generateSampleFlightStatus({
  flightNumber,
  date,
}: {
  flightNumber: string;
  date: string;
}) {
  const { object: flightStatus } = await generateObject({
    model: geminiFlashModel,
    prompt: `Flight status for flight number ${flightNumber} on ${date}`,
    schema: z.object({
      flightNumber: z.string().describe("Flight number, e.g., BA123, AA31"),
      departure: z.object({
        cityName: z.string().describe("Name of the departure city"),
        airportCode: z.string().describe("IATA code of the departure airport"),
        airportName: z.string().describe("Full name of the departure airport"),
        timestamp: z.string().describe("ISO 8601 departure date and time"),
        terminal: z.string().describe("Departure terminal"),
        gate: z.string().describe("Departure gate"),
      }),
      arrival: z.object({
        cityName: z.string().describe("Name of the arrival city"),
        airportCode: z.string().describe("IATA code of the arrival airport"),
        airportName: z.string().describe("Full name of the arrival airport"),
        timestamp: z.string().describe("ISO 8601 arrival date and time"),
        terminal: z.string().describe("Arrival terminal"),
        gate: z.string().describe("Arrival gate"),
      }),
      totalDistanceInMiles: z
        .number()
        .describe("Total flight distance in miles"),
    }),
  });

  return flightStatus;
}

export async function generateSampleFlightSearchResults({
  origin,
  destination,
}: {
  origin: string;
  destination: string;
}) {
  try {
    // Step 1: Get today's date in the format required by Amadeus API (YYYY-MM-DD)
    const today = '2024-12-31' // 'YYYY-MM-DD' format

// Step 2: Obtain access token for Amadeus API
const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    'grant_type': 'client_credentials',
    'client_id': process.env.AMADEUS_API_KEY,  
    'client_secret': process.env.AMADEUS_API_SECRET 
  })
});


    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error('Failed to obtain access token');
    const accessToken = tokenData.access_token;

    // Step 3: Prepare the query parameters with defaults (departureDate = today, adults = 1, travelClass = "ECONOMY")
    const queryParams = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: today,
      adults: '1',
      travelClass: 'ECONOMY',
      currencyCode: 'USD',
      returnDate: '2025-02-04',
      max: '250',
      nonStop: 'false'
    });

    // Step 4: Call Amadeus API for flight offers
    const amadeusResponse = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!amadeusResponse.ok) {
      throw new Error('Failed to fetch flight data');
    }

    const rawFlightData = await amadeusResponse.json();

    console.log(rawFlightData.data.slice(0,4))
    
    // Step 5: Transform the raw flight data into the expected schema
    const flightSearchResults = rawFlightData.data.slice(0, 4).map((offer: any) => {
      const { price, itineraries, validatingAirlineCodes } = offer;
      const { total } = price;

      // Extract the segments (departure and arrival details)
      const segments = itineraries[0].segments;
      const departureSegment = segments[0]; // First segment is the departure
      const arrivalSegment = segments[segments.length - 1]; // Last segment is the arrival

      return {
        id: offer.id, // Flight ID
        departure: {
          cityName: rawFlightData.dictionaries.locations[departureSegment.departure.iataCode]?.cityCode || "Unknown",
          airportCode: departureSegment.departure.iataCode,
          timestamp: departureSegment.departure.at,
        },
        arrival: {
          cityName: rawFlightData.dictionaries.locations[arrivalSegment.arrival.iataCode]?.cityCode || "Unknown",
          airportCode: arrivalSegment.arrival.iataCode,
          timestamp: arrivalSegment.arrival.at,
        },
        airlines: validatingAirlineCodes.map(
          (code: string) => rawFlightData.dictionaries.carriers[code] || code
        ), // Map carrier codes to airline names
        priceInUSD: parseFloat(total), // Flight price in USD
        numberOfStops: segments.length - 1, // Number of stops
      };
    });
    console.log()

    return { flights: flightSearchResults };

  } catch (error) {
    console.error('Error fetching flight data:', error);
    return { flights: [] }; // Return an empty array or handle the error as needed
  }


  // const { object: flightSearchResults } = await generateObject({
  //   model: geminiFlashModel,
  //   prompt: `Generate search results for flights from ${origin} to ${destination}, limit to 4 results`,
  //   output: "array",
  //   schema: z.object({
  //     id: z
  //       .string()
  //       .describe("Unique identifier for the flight, like BA123, AA31, etc."),
  //     departure: z.object({
  //       cityName: z.string().describe("Name of the departure city"),
  //       airportCode: z.string().describe("IATA code of the departure airport"),
  //       timestamp: z.string().describe("ISO 8601 departure date and time"),
  //     }),
  //     arrival: z.object({
  //       cityName: z.string().describe("Name of the arrival city"),
  //       airportCode: z.string().describe("IATA code of the arrival airport"),
  //       timestamp: z.string().describe("ISO 8601 arrival date and time"),
  //     }),
  //     airlines: z.array(
  //       z.string().describe("Airline names, e.g., American Airlines, Emirates"),
  //     ),
  //     priceInUSD: z.number().describe("Flight price in US dollars"),
  //     numberOfStops: z.number().describe("Number of stops during the flight"),
  //   }),
  // });

  // return { flights: flightSearchResults };
}


  
  


export async function generateSampleSeatSelection({
  flightNumber,
}: {
  flightNumber: string;
}) {
  const { object: rows } = await generateObject({
    model: geminiFlashModel,
    prompt: `Simulate available seats for flight number ${flightNumber}, 6 seats on each row and 5 rows in total, adjust pricing based on location of seat`,
    output: "array",
    schema: z.array(
      z.object({
        seatNumber: z.string().describe("Seat identifier, e.g., 12A, 15C"),
        priceInUSD: z
          .number()
          .describe("Seat price in US dollars, less than $99"),
        isAvailable: z
          .boolean()
          .describe("Whether the seat is available for booking"),
      }),
    ),
  });

  return { seats: rows };
}

export async function generateReservationPrice(props: {
  seats: string[];
  flightNumber: string;
  departure: {
    cityName: string;
    airportCode: string;
    timestamp: string;
    gate: string;
    terminal: string;
  };
  arrival: {
    cityName: string;
    airportCode: string;
    timestamp: string;
    gate: string;
    terminal: string;
  };
  passengerName: string;
}) {
  const { object: reservation } = await generateObject({
    model: geminiFlashModel,
    prompt: `Generate price for the following reservation \n\n ${JSON.stringify(props, null, 2)}`,
    schema: z.object({
      totalPriceInUSD: z
        .number()
        .describe("Total reservation price in US dollars"),
    }),
  });

  return reservation;
}
