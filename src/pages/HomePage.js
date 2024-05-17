import AdditionWidget from "../components/AdditionWidget";

function HomePage() {
    return (
        <div id="HomePage">
            <header>
                <h3>
                    正在思考这个网站可以做什么，先放个加法在这里👇
                </h3>
            </header>

            <br/><br/><br/><br/>

            <AdditionWidget />
        </div>
    );
}

export default HomePage;