 
const createProduct=(e)=>{
 e.preventDefault();
 fetch("http://localhost:3000/add-product", {
   method: "post",
   headers: { "content-type": "application/json" },
   body: JSON.stringify
   ({
     product_name: document.querySelector("input[name=product_name]").value,
     product_url: document.querySelector("input[name=product_name]").value,
     product_brief_description: document.querySelector(
       "textarea[name=product_brief_description]"
     ).value,
     product_description: document.querySelector(
       "textarea[name=product_description]"
     ).value,
     product_img: document.querySelector("input[name=product_img]").value,
     product_link: document.querySelector("input[name=product_link]").value,
     starting_price: document.querySelector("input[name=starting_price]").value,
     price_range: document.querySelector("input[name=price_range]").value,
     user_name: document.querySelector("input[name=user_name]").value,
     user_password: document.querySelector("input[name=user_password]").value,
     order_id: document.querySelector("input[name=order_id]").value,
     user_id: document.querySelector("input[name=user_id]").value,
     product_id: document.querySelector("input[name=product_id]").value
   }),
 }).then(()=>alert("product added successfully!")).catch((err)=>console.log(err)); // since fetch returns a promise
}

document.getElementById("form").addEventListener("submit", createProduct)