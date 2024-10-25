import { generateObject } from "ai";
import { z } from "zod";

import { geminiFlashModel } from ".";

// Add this method at the top of the file or before its first usage
function convertISO8601ToHours(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);

  // Calculate total hours and round to 2 decimal places
  return parseFloat((hours + minutes / 60).toFixed(2));
}

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
  departureDate
}: {
  origin: string;
  destination: string;
  departureDate: string
}) {
  try {

    console.log(origin, destination, departureDate)
    console.log(process.env.SERP_API_KEY)
    const queryParams = new URLSearchParams({
      api_key: process.env.SERP_API_KEY || '',
      engine: 'google_flights',
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departureDate,
      type: '2'
    });
    
    const response = await fetch(`https://serpapi.com/search?${queryParams.toString()}`, {
      method: 'GET'
    });
    
    
    console.log("API Response",response)

    if (!response.ok) {
      throw new Error('Failed to fetch flight data');
    }

    const rawFlightData = await response.json();

    console.log(rawFlightData)
    
    // Step 5: Transform the raw flight data into the expected schema
    const flightSearchResults = rawFlightData.best_flights.slice(0, 4).map((offer: any) => {
      const flight = offer.flights[0];
      const { departure_airport, arrival_airport, airline, travel_class, flight_number, overnight, duration } = flight;
    
      // Convert duration from minutes to hours and minutes format
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      const formattedDuration = `${hours}.${minutes}`;
    
      return {
        id: offer.booking_token, // Unique booking identifier
        departure: {
          airportName: departure_airport.name || "Unknown",
          airportCode: departure_airport.id || "Unknown",
          timestamp: departure_airport.time || "Unknown",
        },
        arrival: {
          airportName: arrival_airport.name || "Unknown",
          airportCode: arrival_airport.id || "Unknown",
          timestamp: arrival_airport.time || "Unknown",
        },
        airlines: [airline], // Airline name in array format for consistency
        priceInUSD: parseFloat(offer.price) || 0, // Price in USD
        travelClass: travel_class || "Unknown", // Travel class
        flightNumber: flight_number || "Unknown", // Flight number
        overnight: overnight || false, // Indicates if the flight is overnight
        duration: formattedDuration, // Total flight duration in hours and minutes
      };
    });
    
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
