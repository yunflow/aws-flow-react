import AdditionWidget from "../components/AdditionWidget";

function HomePage() {
    return (
        <div id="HomePage">
            <iframe
                src="/webgl/index.html"
                width="100%"
                height="100%"
            ></iframe>

            <header>
                <h3>
                    还不知道这个网站可以做什么，先放个加法在这里👇
                </h3>
            </header>

            <br />
            <AdditionWidget />
        </div>
    );
}

export default HomePage;