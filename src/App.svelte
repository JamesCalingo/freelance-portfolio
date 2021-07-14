<script>
</script>

<main>
  <header>
    <h1>James Calingo</h1>
    <h2>Developing websites and applications for you.</h2>
  </header>
  <div class="card">
    <div class="headline">
      Hi! I'm James Calingo, a full stack web developer with experience in
      modern HTML, CSS, and JavaScript, as well as several frameworks.
    </div>
    <div class="bullets">
			<div class="card">
				<h1>card 1</h1>
			</div>
			<div class="card">
				<h1>card 2</h1>
			</div>
			<div class="card">
				<h1>card 3</h1>
			</div>
		</div>
  </div>

  <div class="card">This area will be images of projects</div>

  <div class="card">This will be testemonials</div>

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

  .card {
    margin-bottom: 50px;
    height: 30vh;
    border: 3px solid green;
    border-radius: 3px;
  }

	.bullets {
		display: flex;
		justify-content: space-evenly;
	}

	.bullets .card {
		height: 90%;
	}

  h1 {
  color: green;
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
