<script>
	let meal
	const givemeameal = () => {
		fetch(`https://www.themealdb.com/api/json/v1/1/random.php`)
			.then( res => res.json() )
				.then( json => {
					console.log(json)
					meal = json.meals[0]
		
				})
	}
</script>


<main>
	
<link href="https://fonts.googleapis.com/css2?family=Italianno&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Italianno&family=Montserrat+Subrayada:wght@700&display=swap" rel="stylesheet">
	<header>
		<button on:click={givemeameal}>Give me some ideas!</button>
	</header>

	{#if meal}
		<h1 id="overskrift">{meal.strMeal}</h1>
		<div class="container">
		<div class="img">
			<img src="{meal.strMealThumb}" alt="{meal.strMeal}">
		</div>
		<div class="text">
			<h3>Type of meal: {meal.strCategory}</h3>
			<h3>This is what you need:</h3>
			<p>{meal.strMeasure1 ? meal.strMeasure1:''} {meal.strIngredient1 ? meal.strIngredient1:''}</p>
			<p>{meal.strMeasure2 ? meal.strMeasure2:''} {meal.strIngredient2 ? meal.strIngredient2:''}</p>
			<p>{meal.strMeasure3 ? meal.strMeasure3:''} {meal.strIngredient3 ? meal.strIngredient3:''}</p>
			<p>{meal.strMeasure4 ? meal.strMeasure4:''} {meal.strIngredient4 ? meal.strIngredient4:''}</p>
			<p>{meal.strMeasure5 ? meal.strMeasure5:''} {meal.strIngredient5 ? meal.strIngredient5:''}</p>
			<p>{meal.strMeasure6 ? meal.strMeasure6:''} {meal.strIngredient6 ? meal.strIngredient6:''}</p>
			<p>{meal.strMeasure7 ? meal.strMeasure7:''} {meal.strIngredient7 ? meal.strIngredient7:''}</p>
			<p>{meal.strMeasure8 ? meal.strMeasure8:''} {meal.strIngredient8 ? meal.strIngredient8:''}</p>
			<p>{meal.strMeasure9 ? meal.strMeasure9:''} {meal.strIngredient9 ? meal.strIngredient9:''}</p>
			<p>{meal.strMeasure10 ? meal.strMeasure10:''} {meal.strIngredient10 ? meal.strIngredient10:''}</p>
			
		
		</div>
		</div>
	{:else}
	
		<h1 id="overskrift1">Tasteful recipies</h1>
		<h2 id="overskrift2">In need of some food inspiration? Look no further. </h2>
	{/if}
</main>

<style>
	:global(body){
		  background-image: url(https://i.pinimg.com/564x/ee/b7/34/eeb73402f46210700093158eed6f8cf0.jpg);
		  background-repeat: no-repeat;
		  background-size: 100%;
		
		  
	}	
	p {
		color: white;
		margin-top: -13px;
		font-size: 1rem;

	}
	h3 {
		color: white;
		
	}
	main {
		padding: 10vw;
	}
	#overskrift1 {
		color: rgb(199, 224, 157);
		font-size: 7rem;
		font-weight: 100;
		text-align: center;
		font-family: 'Italianno', cursive;
	}

	h1 {
		color: white;
		text-align: center;
		font-size: 3rem;
		font-family: 'Bebas Neue', cursive;
	}
	h2 {
		text-align: center;
		font-family: 'Bebas Neue', cursive;
		color: white;
		font-size: 1.5rem;
		position: relative;
		bottom: 80px;
	}
	button {
		color: #eee;
		background-color: darkslategray;
		font-family: 'Bebas Neue', cursive;
		border: 3px solid darkslategray;
    	border-radius: 1rem;
    	background-color: inherit;
		font-size: 1.5rem;
		
	}
	button:hover {
		color: white;
		background: rgb(62, 59, 80);
		border-color: darkslategray;
		transition: all 0.4s ease 0s;
	}

	header {
		text-align: center;
	}
	.container{
		display: flex;
		align-items: center;
	}
	
	img{
	
	width:250px;
  	text-align:center;
 	display:block;
  	background-color: transparent;
 	border: 1px solid transparent;
 	margin-right: 20px;
  	margin-bottom: 1px;
  	float:left;	
	position: relative;
	} 

	.img{
		right: 50px;
		align-items: center;
		
	} 
	.text{
		align-items: center;
		
	}
	

	/* @media (min-width: 640px) {
		main {
			max-width: none;
		}
	} */
</style>