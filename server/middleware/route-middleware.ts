import clientTracker from './client-tracker'

// Collection of middleware to run on all routes in order
export default defineEventHandler((event) => {
  // Run client tracker middleware
  clientTracker(event)
  
  // Add more middleware here as needed
  // middleware2(event)
  // middleware3(event)
})