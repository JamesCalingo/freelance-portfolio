<script>
  export function handleAlert() {
  	alert("I got a click!")
  }
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

  <div class="card">

  <div id="bullets">
    <div>
      <h2>Frameworks</h2>
      <p class="description">
        Using the latest frameworks and tools, make a website that looks and
        functions well on computers, phones, and tablets.
      </p>
    </div>

    <div>
      <h2>BUZZWORD</h2>
      <p class="description">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae
        veritatis delectus, deserunt suscipit cumque blanditiis veniam aliquam
        voluptatum maiores, nesciunt odit debitis aspernatur, hic accusamus
        excepturi in voluptas eveniet optio.
      </p>
    </div>

    <div>
      <h2>card 3</h2>
      <p class="description">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perspiciatis
        quos tenetur libero soluta. Nihil voluptate, modi atque odit, rem
        similique, delectus voluptates repellat laborum quasi velit accusantium
        temporibus tempore quas?
      </p>
    </div>
  </div>

  <div id="paragraph">
    <div>
    <h4>At our company, we do our best to make sure YOU are satisfied. We work extensively for your satisfaction - which is basically what I said in the first sentence.</h4>
  </div>
    <div class="card">
      Lorem ipsum dolor, sit amet consectetur adipisicing elit. Culpa magni, vero debitis commodi corporis ad, praesentium consectetur voluptatum in veniam aperiam sunt nisi rem. Eos quam modi eaque omnis sed.
    </div>
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
      <li>
        "This isn't actually a quote from anyone. It's just some stuff I'm
        writing in as a filler quote."<br />
        -Stranger on the Internet
      </li>
    </ul>
  </div>

  <div id="contact-form">
    <h2>Let's get in touch!</h2>
    <label for="name">Name</label>
    <input type="text" />

    <label for="email">Email</label>
    <input type="text" />

    <label for="description">Describe your project</label>
    <textarea name="description" id="description" rows="10" />
    <br />
    <button on:click={handleAlert} type="submit">Submit</button>

    <p>Alternatively, you can send me an email here:</p>

    <button><a href="mailto:jciscreative@gmail.com">auhhhhEmaaaaaiiillll</a></button>
  </div>

</main>
<p>This site was made using <a href="https://svelte.dev" target="blank">Svelte</a></p>

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

  .card {
    margin-bottom: 50px;
    border: 3px solid green;
    border-radius: 10px;
  }

 

  #contact-form {
    border: 3px solid black;
    border-radius: 10px;
  }

  @media (min-width: 640px) {
    main {
      max-width: 70%;
    }

    h1 {
      font-size: 4em;
    }

    input,
    textarea {
      width: 50%;
    }

    .card {
      margin-bottom: 50px;
      border: 3px solid green;
      border-radius: 10px;
    }

    #bullets {
      margin-top: 30px;
      display: flex;
      justify-content: space-evenly;
    }

    #bullets div {
      width: 25%;
    }

    #paragraph {
      display: grid;
      grid-template-columns: 2fr 1fr;
    }

    .description {
      font-size: 18pt;
    }

    #testemonial ul {
      display: flex;
      justify-content: space-between;
      list-style: none;
      width: 40%;
    }

    #testemonial li {
      margin: 15px 0;
    }

    button a {
      color: black;
    }
  }
</style>
