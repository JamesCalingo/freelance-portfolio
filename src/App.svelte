<script>
  // 	const card = document.querySelectorAll(".card")

  // function alert() {
  // 	alert("I got a click!")
  // }
  // 	card.addEventListener("click", alert)
</script>

<main>
  <header>
    <h1>JAMES CALINGO</h1>
  </header>

  <h2>
    Hi! I'm James Calingo (or "JC" as my friends call me), a full stack web
    developer with experience in modern HTML, CSS, and JavaScript, as well as
    several frameworks.
  </h2>

  <div id="bullets">
    <div class="card">
      <h2>Frameworks</h2>
      <p>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam eum soluta
        laudantium ducimus iure placeat est totam molestias nobis corporis, iste
        dolorem in molestiae qui quibusdam ex delectus maxime. Ab.
      </p>
    </div>
    <div class="card">
      <h2>BUZZWORD</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae
        veritatis delectus, deserunt suscipit cumque blanditiis veniam aliquam
        voluptatum maiores, nesciunt odit debitis aspernatur, hic accusamus
        excepturi in voluptas eveniet optio.
      </p>
    </div>
    <div class="card">
      <h2>card 3</h2>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perspiciatis
        quos tenetur libero soluta. Nihil voluptate, modi atque odit, rem
        similique, delectus voluptates repellat laborum quasi velit accusantium
        temporibus tempore quas?
      </p>
    </div>
  </div>

  <div id="gallery" class="card">
    This area will be a gallery with images of projects
  </div>

  <div id="testemonial" class="card">
    <h2>What they're saying</h2>
    <ul>
      <li>
        "You're my favorite customer."<br />
        -Me, to you one day
      </li>
      <li>
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium
        sequi perspiciatis voluptatibus ipsam odit amet maxime impedit eos saepe
        reiciendis? Soluta id molestias accusantium sint facere ducimus nulla
        dolores est."<br />
        -Some generic Latin text
      </li>
			<li>"This isn't actually a quote from anyone. It's just some stuff I'm writing in as a filler quote."<br>
				-Stranger on the Internet
			</li>
    </ul>
  </div>

  <div id="contact-form">
    <h2>Let's get in touch!</h2>
    <label for="name">Name</label>
    <input type="text" />

		<label for="email">Email</label>
		<input type="text">

		<label for="description">Describe your project</label>
		<textarea name="description" id="description" cols="99" rows="10"></textarea>
		<br>
		<button type="submit">Submit</button>
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
    justify-content: center;
    margin-bottom: 30px;
    height: 150px;
    line-height: 150px;
    color: white;
    background: green;
  }

  input {
    width: 80%;
  }

  h1 {
    font-size: 4em;
  }
  .card {
    margin-bottom: 50px;
    height: 30vh;
    border: 3px solid green;
    border-radius: 10px;
  }

	#contact-form {
		border: 3px solid black;
		border-radius: 10px;
	}

  @media (min-width: 640px) {
    main {
      max-width: 85%;
    }

    #bullets {
      margin-top: 30px;
      display: flex;
      justify-content: space-evenly;
    }

    #bullets .card {
      height: 90%;
      width: 25%;
    }



		#testemonial ul {
			list-style: none;
			width: 40%
		
		}

		#testemonial li {
			margin: 15px 0
		}
  }
</style>
