function apiCall (tkr) {
  return $.ajax({
    url:`https://cloud.iexapis.com/stable/stock/${tkr.toLowerCase()}/batch?types=quote&range=1m&last=10&token=pk_b4a2fd7fbf944e9a9273780ff852d85d`
  })
}

$(() => {
  $('#inputFile').on('change', () => {
    $('.results').html(' ')
    $('.errorMessage').html(' ')
    const ticker = []
    const prices = []
    const iex = []

    function readExcel () {
      return new Promise(res => {
        readXlsxFile(inputFile.files[0])
          .then(rows => {
            for (let i = 1; i < rows.length; i++) {
              ticker.push(rows[i][0])
              prices.push(rows[i][1])
            }
          })
          .then(() => res("Excel Done"))
          .catch(console.error)
      })
    }

    async function checkPrices () {
      const result = await readExcel()
      if (result === 'Excel Done') {
        const promises = []
        for (let i = 0; i < ticker.length; i++) {
          promises.push(apiCall(ticker[i]))
        }
        Promise.all(promises)
          .then(arr => arr.forEach(res => {
            iex.push(res.quote)
          }))
          .then(() => {
            for (let i = 0; i < prices.length; i++) {
              const date = new Date()
              const dateString = date.toString().split(' ').splice(0,4).splice(1,3).join(' ')
              if (iex[i].latestPrice < prices[i]) {
                $('.results').append(`
                  <div class="container">
                    <p class="stockInfo"><i><b>${iex[i].companyName}</b></i> ha chiuso oggi ${dateString} a <b class="failure">$${iex[i].latestPrice.toFixed(2)}</b> sotto lo stop di <b>$${prices[i].toFixed(2)}</b></p>
                  </div>
                  `)
              } else {
                if ((iex[i].changePercent * 100).toFixed(2) > 0) {
                  $('.results').append(`
                    <div class="container">
                      <p class="stockInfo"><i><b>${iex[i].companyName}</b></i> ha chiuso oggi ${dateString} a <b class="success">$${iex[i].latestPrice.toFixed(2)}</b> lo stop e' a <b>$${prices[i].toFixed(2)}</b> su del <b class="success">${(iex[i].changePercent * 100).toFixed(2)}%</b></p>
                    </div>
                    `)
                } else {
                  $('.results').append(`
                    <div class="container">
                      <p class="stockInfo"><i><b>${iex[i].companyName}</b></i> ha chiuso oggi ${dateString} a <b class="success">$${iex[i].latestPrice.toFixed(2)}</b> lo stop e' a <b>$${prices[i].toFixed(2)}</b> giu del <b class="failure">${(iex[i].changePercent * 100).toFixed(2)}%</b></p>
                    </div>
                    `)
                }
              }
            }
          })
          .catch(err => {
            $('.errorMessage').html(`<p class="errorMessage failure">Error message: <b>${err.responseText}</b> in file<p>`)
          })
      }
    }

    checkPrices()
  })
})
