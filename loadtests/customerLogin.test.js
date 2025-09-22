import http from 'k6/http'
import { check, sleep } from 'k6'


export let options = {
    vus : 10,            //virtual customers
    duration : '30s'      // test time
}
// default is must else, test wont run
export default function testCustomerLogin(){
    try{
        let cusLoginApi = `http://localhost:3030/api/auth/customer/login`

        let loginDetail = JSON.stringify({
            email : "jmk@gmail.com",
            password: "Jamesmike01#"
        })
        let params = { headers: { 
            "Content-Type": "application/json",
            "x-test-request" : 'true'
        } };
        let response = http.post(cusLoginApi, loginDetail, params)
        console.log("Cus Test Response: ", response.body)
        check(response, {
            "Status is 200" : response => response.status === 200,
            "response time < 500ms" : (response)=> response.timings.duration < 500
        }

    )
        sleep(1) // pause to simulate real users
    }catch(testError){
        console.log("Error running customerLogintest: ", testError)
    }
    
}

































