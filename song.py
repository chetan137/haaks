import time
import sys

def print_lyrics():
    lyrics = [
        "Baato-baato me hi, Mwabio Mwabio me hi were qarrabh hai tu",
        "Teri talab mujhko, teri talab, janna, ho to kabit ru'ba ru",
        "Shor-sharaba jo seene me hai mere, kelse bayaan nai karu",
        "Haal jo mera hai, hai kis to bataur",
        "Mere sahiba, dil na kiraaye ka, thoda to sahiba lo na",
        "Nazuk hai yeh, took jaata hai",
        "Sahiba, neende-veende aaye na",
        "Paata kaati jaaye na",
        "Tera hi khayal"
    ]

    print("Now Playing - Sahiba")
    print()
    time.sleep(1)

    for line in lyrics:
        words = line.split()
        for word in words:
            print(word, end=' ', flush=True)
            time.sleep(0.3)  # Adjust timing as needed
        print()  # New line after each lyric line
        time.sleep(0.5)  # Pause between lines

# Call the function
print_lyrics()
