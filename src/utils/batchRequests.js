/**
 * Utility to batch API requests to prevent rate limiting
 * Sends requests in small batches with delays between batches
 */

/**
 * Execute requests in batches to prevent rate limiting
 * @param {Array<Function>} requestFns - Array of functions that return promises
 * @param {number} batchSize - Number of requests per batch (default: 3)
 * @param {number} delayBetweenBatches - Delay in ms between batches (default: 100)
 * @returns {Promise<Array>} - Array of results in the same order as requestFns
 */
export const batchRequests = async (requestFns, batchSize = 3, delayBetweenBatches = 100) => {
  const results = []
  
  for (let i = 0; i < requestFns.length; i += batchSize) {
    const batch = requestFns.slice(i, i + batchSize)
    
    // Execute batch in parallel
    const batchResults = await Promise.all(
      batch.map(fn => fn().catch(err => {
        // Return error object instead of throwing
        return { error: err }
      }))
    )
    
    // Add results to main results array
    results.push(...batchResults)
    
    // Wait before next batch (except for last batch)
    if (i + batchSize < requestFns.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
    }
  }
  
  return results
}

/**
 * Execute requests sequentially with a delay between each
 * Use this for critical requests that must complete in order
 * @param {Array<Function>} requestFns - Array of functions that return promises
 * @param {number} delayBetweenRequests - Delay in ms between requests (default: 50)
 * @returns {Promise<Array>} - Array of results in the same order as requestFns
 */
export const sequentialRequests = async (requestFns, delayBetweenRequests = 50) => {
  const results = []
  
  for (const fn of requestFns) {
    try {
      const result = await fn()
      results.push(result)
    } catch (err) {
      results.push({ error: err })
    }
    
    // Wait before next request
    if (requestFns.indexOf(fn) < requestFns.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
    }
  }
  
  return results
}

