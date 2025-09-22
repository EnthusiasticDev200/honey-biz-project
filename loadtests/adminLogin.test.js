import http from 'k6/http'
import {check, sleep} from 'k6'


export let options = { // mudt be options else vus will be 1 not 
    vus : 10,
    duration : '30s'
}

export default function adminLogin(){
    let api = 'http://localhost:3030/api/auth/admin/login'

    let adminDetail = JSON.stringify({
        email : "imohchad@gmail.com",
        password : "Richad01#"
    })

    let params = { headers: {
        "Content-Type" : "application/json",
        "x-test-request" : 'true'
    }}
    
    let response = http.post(api, adminDetail, params)

    check(response, {
        "Status 200": response => response.status === 200,
        "Duration < 500ms" : response => response.timings.duration < 500
    })

    sleep(1)
}

































