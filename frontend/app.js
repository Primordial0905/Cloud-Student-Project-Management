const button = document.getElementById("testButton");
const result = document.getElementById("result");

button.addEventListener("click", async function(){
    result.textContent = "Connecting to API...";

    try {
        const response = await fetch("/api/status");
        
        if(!response.ok){
            throw new Error("API request failed.")
        }

        const data = await response.json();

        result.textContent = data.message;
    } catch (error) {
        result.textContent = "Unable to connect to API..."
        console.error(error); 
    }
});