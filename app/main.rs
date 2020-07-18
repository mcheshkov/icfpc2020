use http_body::Body as _;
use hyper::client::HttpConnector;
use hyper::{Body, Client, Method, Request, Response, StatusCode};
use hyper_tls::HttpsConnector;
use std::env;
use std::process;
use std::thread;
use std::time;

mod modulation;

/*
https://icfpcontest2020.github.io/#/post/2051
starterkits are not about sending alien requests - they just demonstrate that you can send POST requests and pass parameters that came from cmdline args. playerKey you get from command line is not an Api Key - it is just a random number that you should send to url in args[0] - that is what our testing system expect. You should not use your Api Key in this requests - nothing says about it. But! You can use starter kits to understand HOW TO correctly send http requests, if you never did it before. Moreover, you can run starterkit locally with arguments https://icfpc2020-api.testkontur.ru/aliens/send?apiKey=<> with correct encoded aliens string in body and it will work. That's what we tested and it works perfectly.
docs about it is under construction. I described this earlier in this chat - in short - /aliens/send - sends your data to aliens. But they can answer fast or slow (we don't know why). If they answer slow, we return 302 to you instead of 200. Along with 302 you have Location header - where you can find the answer later. This location header is really /aliens/{responseId}
In fact it's a long-polling protocol. You can send next request to Location immediately after getting 302 response
don't forget to send your player key (cli args[1]) to the server url (cli args[0]) before sending to aliens/send
*/

async fn dump_failed_body(
    mut res: Response<Body>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("Unexpected server response:");
    println!("HTTP code: {}", res.status());
    print!("Response body: ");
    while let Some(chunk) = res.body_mut().data().await {
        match chunk {
            Ok(content) => println!("{:?}", content),
            Err(why) => println!("error reading body: {:?}", why),
        }
    }

    Ok(())
}

async fn send_player_key(
    client: &Client<HttpsConnector<HttpConnector>>,
    url: &str,
    key: String,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let req = Request::builder()
        .method(Method::POST)
        .uri(url)
        .body(Body::from(key.clone()))
        .expect("Could not make request for player key");

    match client.request(req).await {
        Ok(res) => match res.status() {
            StatusCode::OK => {
                println!("Player key sent");
            }
            _ => {
                dump_failed_body(res).await?;
                process::exit(2);
            }
        },
        Err(err) => {
            println!("Unexpected server response:\n{}", err);
            process::exit(1);
        }
    }

    Ok(())
}

async fn send_to_aliens(
    client: &Client<HttpsConnector<HttpConnector>>,
    url: &str,
    api_key: &str,
    body: String,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut uri = url.to_owned() + "/aliens/send";
    if !api_key.is_empty() {
        uri += &format!("?apiKey={}", api_key);
    }
    println!("Making request to {}", uri);

    let req = Request::builder()
        .method(Method::POST)
        .uri(uri)
        .body(Body::from(body))?;

    match client.request(req).await {
        Ok(mut res) => match res.status() {
            StatusCode::OK => {
                print!("Server response: ");
                while let Some(chunk) = res.body_mut().data().await {
                    match chunk {
                        Ok(content) => println!("{:?}", content),
                        Err(why) => println!("error reading body: {:?}", why),
                    }
                }
            }
            _ => {
                dump_failed_body(res).await?;
                process::exit(2);
            }
        },
        Err(err) => {
            println!("Unexpected server response:\n{}", err);
            process::exit(1);
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let args: Vec<String> = env::args().collect();

    let server_url = &args[1];
    let player_key = &args[2];
    let api_key = args.get(3).cloned().unwrap_or("".to_string());

    println!("ServerUrl: {}; PlayerKey: {}", server_url, player_key);

    let client = Client::builder().build::<_, hyper::Body>(HttpsConnector::new());
    if !player_key.is_empty() {
        send_player_key(&client, server_url, player_key.to_string()).await?;
    }

    send_to_aliens(&client, &server_url, &api_key, "1101000\n".to_owned()).await?;
    thread::sleep(time::Duration::from_secs(12));
    send_to_aliens(&client, &server_url, &api_key, "1101000\n".to_owned()).await?;
    thread::sleep(time::Duration::from_secs(6));
    send_to_aliens(&client, &server_url, &api_key, "1101000\n".to_owned()).await?;

    Ok(())
}
