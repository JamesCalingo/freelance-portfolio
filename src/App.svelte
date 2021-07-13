<script>

</script>

<main>
<header>
	<h1>James Calingo</h1>
	<h2>Developing websites and applications for you.</h2>
</header>
	<div class="card">
		This card will be myw blurbs
	</div>

	<div class="card">
		This area will be images of projects
	</div>

	<div class="card">
		This will be testemonials
	</div>

	<div class="card">
	<label for="text">This will be a contact form</label>
		<input type="text" placeholder="People can type stuff in here" />
	</div>

<p>Some ending stuff</p>
	
</main>

<style>
	main {
		text-align: center;
		max-width: 240px;
		margin: 0 auto;
	}

	header {
		margin-bottom: 30px;
		background: blue;
	}

input {
	width: 80%;
}

	.card{
		margin-bottom: 50px;
		height: 30vh;
		border: 3px solid green;
		border-radius: 3px;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: 85%;
		}
	}
</style>